import {
  ALARM_NAMES,
  setupAlarms,
  runDailyCheck,
  runContestCheck,
  sendStartupNotifications,
  enforceSolveBeforeScroll,
} from './worker.js';
import { syncLeetCodeNetworkRules, syncFocusModeNetworkRules } from '../services/network.js';
import {
  getFocusModeEnabled,
  setFocusModeEnabled,
  getSolveBeforeScrollEnabled,
  setSolveBeforeScrollEnabled,
  getAutoFocusLocked,
  storageGet,
  storageSet,
  STORAGE_KEYS,
} from '../services/storage.js';

/**
 * Handle extension installation or version upgrade while preserving all persisted user data.
 */
export async function handleInstalled(details = {}, customDeps = {}) {
  const syncLeetCode = customDeps.syncLeetCodeNetworkRules || syncLeetCodeNetworkRules;
  const syncFocus = customDeps.syncFocusModeNetworkRules || syncFocusModeNetworkRules;
  const readFocusEnabled = customDeps.getFocusModeEnabled || getFocusModeEnabled;
  const checkDaily = customDeps.runDailyCheck || runDailyCheck;
  const checkContest = customDeps.runContestCheck || runContestCheck;
  const sendStartup = customDeps.sendStartupNotifications || sendStartupNotifications;
  const setStorage = customDeps.storageSet || storageSet;

  // Restore focus DNR rules immediately from preserved storage
  const focusEnabled = await readFocusEnabled();
  await syncFocus(Boolean(focusEnabled));

  // Record non-destructive upgrade metadata without altering user settings or caches
  if (details?.reason === 'update') {
    await setStorage(STORAGE_KEYS.EXTENSION_META, {
      previousVersion: details.previousVersion || 'unknown',
      currentVersion: customDeps.currentVersion || '1.0.9',
      updatedAt: Date.now(),
    });
  }

  await syncLeetCode();
  await Promise.all([checkDaily(), checkContest()]);
  await sendStartup();
}

/**
 * Register background service worker listeners across Chrome, Edge, and Firefox MV3.
 */
export function registerBackgroundListeners(customApis = {}, customDeps = {}) {
  const chromeGlobal = typeof chrome !== 'undefined' ? chrome : null;
  const browserGlobal = typeof browser !== 'undefined' ? browser : null;
  const ext = chromeGlobal || browserGlobal;

  const alarms = customApis.alarms ?? ext?.alarms ?? null;
  const runtime = customApis.runtime ?? ext?.runtime ?? null;
  const notifications = customApis.notifications ?? ext?.notifications ?? null;
  const tabs = customApis.tabs ?? ext?.tabs ?? null;
  const cookies = customApis.cookies ?? ext?.cookies ?? null;
  const storage = customApis.storage ?? ext?.storage ?? null;

  const syncLeetCode = customDeps.syncLeetCodeNetworkRules || syncLeetCodeNetworkRules;
  const syncFocus = customDeps.syncFocusModeNetworkRules || syncFocusModeNetworkRules;
  const readFocusEnabled = customDeps.getFocusModeEnabled || getFocusModeEnabled;
  const checkDaily = customDeps.runDailyCheck || runDailyCheck;
  const checkContest = customDeps.runContestCheck || runContestCheck;
  const sendStartup = customDeps.sendStartupNotifications || sendStartupNotifications;
  const initAlarms = customDeps.setupAlarms || setupAlarms;

  // Initialize network header modification and focus mode rules on worker startup
  syncLeetCode();
  Promise.resolve(readFocusEnabled()).then((enabled) => syncFocus(Boolean(enabled)));

  // Keep Focus Mode DNR rules in sync whenever toggled in storage
  if (storage?.onChanged) {
    storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.FOCUS_MODE]) {
        syncFocus(Boolean(changes[STORAGE_KEYS.FOCUS_MODE].newValue));
      }
    });
  }

  // Only re-sync DNR rules when LeetCode session/CSRF cookies change (debounced, no loops)
  let cookieSyncTimer = null;
  if (cookies?.onChanged) {
    cookies.onChanged.addListener((changeInfo) => {
      const cookie = changeInfo?.cookie;
      if (!cookie || !cookie.domain || !cookie.domain.includes('leetcode.com')) return;
      if (cookie.name !== 'LEETCODE_SESSION' && cookie.name !== 'csrftoken') return;

      if (cookieSyncTimer) clearTimeout(cookieSyncTimer);
      cookieSyncTimer = setTimeout(() => {
        syncLeetCode();
        if (cookie.name === 'LEETCODE_SESSION' && changeInfo.cause === 'explicit') {
          checkDaily();
        }
      }, 2000);
    });
  }

  // Run initial check and preserve data cleanly on install/update
  if (runtime?.onInstalled) {
    runtime.onInstalled.addListener((details) => {
      const manifestVersion = runtime.getManifest?.()?.version || '1.0.9';
      handleInstalled(details, {
        ...customDeps,
        currentVersion: manifestVersion,
      });
    });
  }

  // Send startup notifications when user launches browser for the first time
  if (runtime?.onStartup) {
    runtime.onStartup.addListener(() => {
      Promise.resolve(syncLeetCode()).then(() => sendStartup());
    });
  }

  // Initialize periodic alarms
  if (alarms) {
    initAlarms(alarms);

    if (alarms.onAlarm) {
      alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === ALARM_NAMES.DAILY_CHECK) {
          Promise.resolve(syncLeetCode()).then(() => checkDaily());
        } else if (alarm.name === ALARM_NAMES.CONTEST_CHECK) {
          checkContest();
        }
      });
    }
  }

  // Handle contest, daily challenge, and login notification clicks
  if (notifications?.onClicked && tabs?.create) {
    notifications.onClicked.addListener(async (notificationId) => {
      if (notificationId.startsWith('contest_')) {
        const slug = notificationId.replace('contest_', '');
        tabs.create({ url: `https://leetcode.com/contest/${slug}` });
      } else if (notificationId.startsWith('login_')) {
        tabs.create({ url: 'https://leetcode.com/accounts/login/' });
      } else if (notificationId.startsWith('daily_')) {
        const cachedDaily = await (customDeps.storageGet || storageGet)(STORAGE_KEYS.CACHED_DAILY, null);
        tabs.create({ url: cachedDaily?.link || 'https://leetcode.com/problemset/' });
      } else {
        tabs.create({ url: 'https://leetcode.com' });
      }
    });
  }

  // Handle messages from popup UI and Web Companion Bridge
  if (runtime?.onMessage) {
    runtime.onMessage.addListener((message, _sender, sendResponse) => {
      // 1. Popup UI Manual Refresh
      if (message?.type === 'REFRESH_DATA') {
        Promise.resolve(syncLeetCode())
          .then(() => Promise.all([checkDaily(), checkContest()]))
          .then(([dailyData, contests]) => {
            sendResponse({ success: true, dailyData, contests });
          })
          .catch((err) => {
            console.error('Refresh error:', err);
            sendResponse({ success: false, error: err?.message || 'Refresh failed' });
          });
        return true;
      }

      // 2. Web Companion Bridge Commands
      if (message?.source === 'LEETING_WEB_BRIDGE') {
        const handleBridge = async () => {
          switch (message.type) {
            case 'GET_STATUS': {
              const [user, daily, contests, focusMode, sbs, autoLocked, activeTimer] = await Promise.all([
                storageGet(STORAGE_KEYS.CACHED_USER, null),
                storageGet(STORAGE_KEYS.CACHED_DAILY, null),
                storageGet(STORAGE_KEYS.CACHED_CONTESTS, []),
                getFocusModeEnabled(),
                getSolveBeforeScrollEnabled(),
                getAutoFocusLocked(),
                storageGet(STORAGE_KEYS.ACTIVE_TIMER, null),
              ]);
              return {
                isOnline: true,
                version: '1.0.9',
                user,
                daily,
                contests,
                focusMode,
                solveBeforeScroll: sbs,
                autoLocked,
                activeTimer,
                timestamp: Date.now(),
              };
            }

            case 'START_FOCUS_TIMER': {
              const durationMinutes = Number(message.payload?.durationMinutes) || 25;
              const startedAt = Number(message.payload?.startedAt) || Date.now();
              const endTime = Number(message.payload?.endTime) || (startedAt + durationMinutes * 60 * 1000);
              const timerData = {
                isActive: true,
                durationMinutes,
                startedAt,
                endTime,
              };

              await storageSet(STORAGE_KEYS.ACTIVE_TIMER, timerData);
              await setFocusModeEnabled(true);
              await syncFocus(true);

              if (tabs?.query) {
                tabs.query({}, (tabList) => {
                  tabList?.forEach((t) => {
                    if (t.id) {
                      tabs.sendMessage(t.id, { type: 'FOCUS_MODE_CHANGED', enabled: true }).catch(() => {});
                      tabs.sendMessage(t.id, { type: 'TIMER_STATE_CHANGED', timer: timerData }).catch(() => {});
                    }
                  });
                });
              }

              return { success: true, timer: timerData, focusMode: true };
            }

            case 'STOP_FOCUS_TIMER': {
              const timerData = { isActive: false, stoppedAt: Date.now() };
              await storageSet(STORAGE_KEYS.ACTIVE_TIMER, timerData);

              const sbs = await getSolveBeforeScrollEnabled();
              const autoLocked = await getAutoFocusLocked();
              let nextFocus = false;

              if (sbs && autoLocked) {
                nextFocus = true;
              } else {
                await setFocusModeEnabled(false);
                await syncFocus(false);
              }

              if (tabs?.query) {
                tabs.query({}, (tabList) => {
                  tabList?.forEach((t) => {
                    if (t.id) {
                      tabs.sendMessage(t.id, { type: 'FOCUS_MODE_CHANGED', enabled: nextFocus }).catch(() => {});
                      tabs.sendMessage(t.id, { type: 'TIMER_STATE_CHANGED', timer: timerData }).catch(() => {});
                    }
                  });
                });
              }

              return { success: true, timer: timerData, focusMode: nextFocus };
            }

            case 'SET_FOCUS_MODE': {
              const requested = Boolean(message.payload?.enabled);
              const sbs = await getSolveBeforeScrollEnabled();
              const autoLocked = await getAutoFocusLocked();

              // If locked by Solve Before Scroll, cannot disable Focus Mode
              if (!requested && sbs && autoLocked) {
                return { success: false, focusMode: true, error: 'Focus Mode is locked by Solve Before Scroll.' };
              }

              await setFocusModeEnabled(requested);
              await syncFocus(requested);
              if (tabs?.query) {
                tabs.query({}, (tabList) => {
                  tabList?.forEach((t) => {
                    if (t.id) {
                      tabs.sendMessage(t.id, { type: 'FOCUS_MODE_CHANGED', enabled: requested }).catch(() => {});
                      tabs.sendMessage(t.id, {
                        type: 'LEETING_STATE_UPDATE',
                        payload: { focusMode: requested },
                      }).catch(() => {});
                    }
                  });
                });
              }
              return { success: true, focusMode: requested };
            }

            case 'SET_SOLVE_BEFORE_SCROLL': {
              const enabled = Boolean(message.payload?.enabled);
              await setSolveBeforeScrollEnabled(enabled);
              const cachedDaily = await storageGet(STORAGE_KEYS.CACHED_DAILY, null);
              const lockState = await enforceSolveBeforeScroll(cachedDaily);

              if (tabs?.query) {
                tabs.query({}, (tabList) => {
                  tabList?.forEach((t) => {
                    if (t.id) {
                      tabs.sendMessage(t.id, {
                        type: 'LEETING_STATE_UPDATE',
                        payload: {
                          solveBeforeScroll: enabled,
                          focusMode: lockState.focusMode,
                          autoLocked: lockState.autoLocked,
                        },
                      }).catch(() => {});
                      tabs.sendMessage(t.id, {
                        type: 'FOCUS_MODE_CHANGED',
                        enabled: lockState.focusMode,
                      }).catch(() => {});
                    }
                  });
                });
              }

              return {
                success: true,
                solveBeforeScroll: enabled,
                focusMode: lockState.focusMode,
                autoLocked: lockState.autoLocked,
              };
            }

            case 'REFRESH_LEETCODE': {
              await syncLeetCode();
              const [daily, contests] = await Promise.all([checkDaily(), checkContest()]);
              const user = await storageGet(STORAGE_KEYS.CACHED_USER, null);
              return { success: true, user, daily, contests };
            }

            default:
              return { error: `Unknown bridge command: ${message.type}` };
          }
        };

        handleBridge()
          .then((res) => sendResponse(res))
          .catch((err) => sendResponse({ error: err?.message || 'Bridge handler error' }));
        return true;
      }
    });
  }
}
