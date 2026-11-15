import {
  fetchUserStatus,
  fetchDailyChallenge,
  fetchUserStreak,
  fetchUpcomingContests,
} from '../services/leetcode.js';
import {
  storageGet,
  storageSet,
  getFocusModeEnabled,
  setFocusModeEnabled,
  getSolveBeforeScrollEnabled,
  getAutoFocusLocked,
  setAutoFocusLocked,
  STORAGE_KEYS,
} from '../services/storage.js';
import { syncFocusModeNetworkRules } from '../services/network.js';

export const ALARM_NAMES = {
  DAILY_CHECK: 'leeting_alarm_daily_check',
  CONTEST_CHECK: 'leeting_alarm_contest_check',
};

/**
 * Update the extension toolbar icon badge
 */
export async function updateBadge(isSolved, streak = 0, actionApi = null) {
  const action = actionApi || (typeof chrome !== 'undefined' ? chrome.action : null);
  if (!action || !action.setBadgeText) return;

  if (isSolved === true) {
    const text = streak > 0 ? (streak > 999 ? '999+' : String(streak)) : '✓';
    await action.setBadgeText({ text });
    if (action.setBadgeBackgroundColor) {
      await action.setBadgeBackgroundColor({ color: '#00b8a3' }); // Teal / Solved
    }
  } else if (isSolved === false) {
    await action.setBadgeText({ text: '!' });
    if (action.setBadgeBackgroundColor) {
      await action.setBadgeBackgroundColor({ color: '#ff375f' }); // Red / Pending
    }
  } else {
    // Unknown or logged out
    await action.setBadgeText({ text: '' });
  }
}

let inFlightDailyPromise = null;
let inFlightContestPromise = null;

/**
 * Enforce "Solve Before Scroll" Mode:
 * Locks Focus Mode ON while today's Daily Challenge is unsolved,
 * and unlocks automatically once the challenge is solved.
 */
export async function enforceSolveBeforeScroll(daily, customDeps = {}) {
  const solveBeforeScroll = await getSolveBeforeScrollEnabled();
  const autoLocked = await getAutoFocusLocked();
  const currentFocus = await getFocusModeEnabled();
  const syncRules = customDeps.syncFocusRules || syncFocusModeNetworkRules;

  const broadcastToTabs = (enabled) => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({}, (tabs) => {
        tabs?.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'FOCUS_MODE_CHANGED', enabled }).catch(() => {});
          }
        });
      });
    }
  };

  if (!solveBeforeScroll) {
    if (autoLocked) {
      await setAutoFocusLocked(false);
    }
    return { focusMode: currentFocus, autoLocked: false };
  }

  const isSolved = Boolean(daily && daily.isSolved);

  if (!isSolved) {
    if (!currentFocus || !autoLocked) {
      await setFocusModeEnabled(true);
      await setAutoFocusLocked(true);
      await syncRules(true);
      broadcastToTabs(true);
    }
    return { focusMode: true, autoLocked: true };
  }

  // Daily challenge is solved -> unlock if it was auto-locked
  if (autoLocked) {
    await setAutoFocusLocked(false);
    await setFocusModeEnabled(false);
    await syncRules(false);
    broadcastToTabs(false);
    return { focusMode: false, autoLocked: false };
  }

  return { focusMode: currentFocus, autoLocked: false };
}

/**
 * Perform periodic daily challenge and user status check (single-flight deduplicated)
 */
export async function runDailyCheck(customDeps = {}) {
  const hasCustomDeps = Object.keys(customDeps).length > 0;
  if (!hasCustomDeps && inFlightDailyPromise) {
    return inFlightDailyPromise;
  }

  const execute = async () => {
    const fetchStatus = customDeps.fetchUserStatus || fetchUserStatus;
    const fetchDaily = customDeps.fetchDailyChallenge || fetchDailyChallenge;
    const fetchStreak = customDeps.fetchUserStreak || fetchUserStreak;
    const setBadge = customDeps.updateBadge || updateBadge;

    let user = { isSignedIn: false, username: null, points: 0, avatar: null };
    let daily = null;
    let dailyError = null;
    let streak = 0;
    let longestStreak = 0;

    // Fetch daily challenge and user status in parallel
    const [dailyResult, userResult] = await Promise.allSettled([fetchDaily(), fetchStatus()]);

    if (dailyResult.status === 'fulfilled') {
      daily = dailyResult.value;
      if (daily) {
        await storageSet(STORAGE_KEYS.CACHED_DAILY, daily);
      }
    } else {
      console.warn('Could not fetch daily challenge:', dailyResult.reason);
      dailyError = dailyResult.reason?.message || 'Daily check failed';
      daily = await storageGet(STORAGE_KEYS.CACHED_DAILY, null);
    }

    if (userResult.status === 'fulfilled') {
      user = userResult.value;
      if (user && user.isSignedIn && user.username) {
        if (typeof user.currentStreak === 'number' && typeof user.longestStreak === 'number' && !customDeps.fetchUserStreak) {
          streak = user.currentStreak;
          longestStreak = user.longestStreak;
        } else {
          try {
            const streakInfo = await fetchStreak(user.username);
            streak = streakInfo.currentStreak || 0;
            longestStreak = streakInfo.longestStreak || 0;
          } catch (streakErr) {
            console.warn('Could not fetch user streak:', streakErr);
            user.streakDebug = `streakErr=${streakErr?.message || 'unknown'}`;
          }
        }
      }
    } else {
      console.warn('Could not fetch user status:', userResult.reason);
      const cached = await storageGet(STORAGE_KEYS.CACHED_USER, null);
      if (cached) {
        user = {
          ...cached,
          streakDebug: `syncErr=${userResult.reason?.message || 'unknown'}`,
        };
        streak = cached.currentStreak || 0;
        longestStreak = cached.longestStreak || 0;
      }
    }

    // Update badge based on daily problem status
    if (daily) {
      await setBadge(daily.isSolved, streak);
    } else {
      await setBadge(null);
    }

    // Enforce "Solve Before Scroll" auto-focus lock when enabled
    const lockState = await enforceSolveBeforeScroll(
      user?.isSignedIn ? daily : null,
      customDeps
    );

    // Cache user data with streak values attached directly on user
    const enrichedUser = user
      ? {
          ...user,
          currentStreak: streak,
          longestStreak,
          lastChecked: Date.now(),
        }
      : null;

    if (enrichedUser) {
      await storageSet(STORAGE_KEYS.CACHED_USER, enrichedUser);
    }

    return {
      user: enrichedUser,
      daily,
      dailyError,
      streak,
      longestStreak,
      focusMode: lockState.focusMode,
      autoLocked: lockState.autoLocked,
    };
  };

  if (hasCustomDeps) {
    return execute();
  }

  inFlightDailyPromise = execute().finally(() => {
    inFlightDailyPromise = null;
  });
  return inFlightDailyPromise;
}

/**
 * Check for upcoming contests and show notification if starting soon
 */
export async function runContestCheck(customDeps = {}) {
  const hasCustomDeps = Object.keys(customDeps).length > 0;
  if (!hasCustomDeps && inFlightContestPromise) {
    return inFlightContestPromise;
  }

  const execute = async () => {
    const fetchContests = customDeps.fetchUpcomingContests || fetchUpcomingContests;
    const notifications = customDeps.notificationsApi || (typeof chrome !== 'undefined' ? chrome.notifications : null);

    try {
      const contests = await fetchContests();
      if (!contests || contests.length === 0) return [];

      await storageSet(STORAGE_KEYS.CACHED_CONTESTS, contests);

      const notifiedContests = (await storageGet(STORAGE_KEYS.NOTIFIED_CONTESTS, {})) || {};
      const now = Date.now();
      const updatedNotified = { ...notifiedContests };

      for (const contest of contests) {
        const minutesUntil = Math.round((contest.startTimeMs - now) / 60000);

        // Notify if starting within 45 minutes and not already notified
        if (minutesUntil > 0 && minutesUntil <= 45 && !updatedNotified[contest.titleSlug]) {
          if (notifications && notifications.create) {
            notifications.create(`contest_${contest.titleSlug}`, {
              type: 'basic',
              iconUrl: (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
                ? chrome.runtime.getURL('icon/128.png')
                : '',
              title: '🏆 LeetCode Contest Alert!',
              message: `${contest.title} starts in ${minutesUntil} minutes! Click to open.`,
              priority: 2,
            });
          }
          updatedNotified[contest.titleSlug] = now;
        }
      }

      await storageSet(STORAGE_KEYS.NOTIFIED_CONTESTS, updatedNotified);
      return contests;
    } catch (err) {
      console.error('Error during contest check:', err);
      return [];
    }
  };

  if (hasCustomDeps) {
    return execute();
  }

  inFlightContestPromise = execute().finally(() => {
    inFlightContestPromise = null;
  });
  return inFlightContestPromise;
}

/**
 * Configure background alarms
 */
export function setupAlarms(alarmsApi) {
  if (!alarmsApi) return;

  // Check daily status every 30 minutes
  alarmsApi.create(ALARM_NAMES.DAILY_CHECK, {
    periodInMinutes: 30,
    delayInMinutes: 0.1,
  });

  // Check contest schedule every 60 minutes
  alarmsApi.create(ALARM_NAMES.CONTEST_CHECK, {
    periodInMinutes: 60,
    delayInMinutes: 0.5,
  });
}

/**
 * Send startup notifications when the user opens the browser:
 * - Upcoming contest alert
 * - Daily coding challenge (if pending)
 * - Optional login reminder if not signed in
 */
export async function sendStartupNotifications(customDeps = {}) {
  const notifications =
    customDeps.notificationsApi || (typeof chrome !== 'undefined' ? chrome.notifications : null);
  if (!notifications || !notifications.create) return;

  const today = new Date().toISOString().split('T')[0];
  const readStorage = customDeps.storageGet || storageGet;
  const writeStorage = customDeps.storageSet || storageSet;

  const lastNotifDate = await readStorage(STORAGE_KEYS.LAST_STARTUP_NOTIF_DATE, null);
  if (lastNotifDate === today && !customDeps.force) {
    return;
  }

  const fetchStatus = customDeps.fetchUserStatus || fetchUserStatus;
  const fetchDaily = customDeps.fetchDailyChallenge || fetchDailyChallenge;
  const fetchContests = customDeps.fetchUpcomingContests || fetchUpcomingContests;

  const iconUrl =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('icon/128.png')
      : '';

  try {
    const [userResult, dailyResult, contestResult] = await Promise.allSettled([
      fetchStatus(),
      fetchDaily(),
      fetchContests(),
    ]);

    const user = userResult.status === 'fulfilled' ? userResult.value : null;
    const daily = dailyResult.status === 'fulfilled' ? dailyResult.value : null;
    const contests = contestResult.status === 'fulfilled' ? contestResult.value : [];

    // 1. User status: if not logged in, prompt to log in
    if (!user || !user.isSignedIn) {
      notifications.create(`login_reminder_${today}`, {
        type: 'basic',
        iconUrl,
        title: '🔑 Log in to LeetCode',
        message: 'Log in to sync your active streak, daily challenges, and contest alerts.',
        priority: 2,
      });
    } else if (daily && !daily.isSolved) {
      // If logged in and today's daily challenge is pending
      notifications.create(`daily_${daily.date || today}`, {
        type: 'basic',
        iconUrl,
        title: '⚡ LeetCode Daily Challenge',
        message: `Today's problem: "${daily.title}" (${daily.difficulty}) is waiting. Keep your streak alive!`,
        priority: 2,
      });
    }

    // 2. Upcoming contest alert
    if (contests && contests.length > 0) {
      const nextContest = contests[0];
      const diffMs = nextContest.startTimeMs - Date.now();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const timeUntil =
          hours > 24 ? `in ${Math.floor(hours / 24)}d ${hours % 24}h` : `in ${hours}h ${mins}m`;

        notifications.create(`contest_${nextContest.titleSlug}`, {
          type: 'basic',
          iconUrl,
          title: `🏆 Upcoming Contest: ${nextContest.title}`,
          message: `Contest starts ${timeUntil}. Click to view details and register!`,
          priority: 1,
        });
      }
    }

    await writeStorage(STORAGE_KEYS.LAST_STARTUP_NOTIF_DATE, today);
  } catch (err) {
    console.warn('Error during startup notifications:', err);
  }
}
