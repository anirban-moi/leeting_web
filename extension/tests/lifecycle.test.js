import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleInstalled,
  registerBackgroundListeners,
} from '../src/background/lifecycle.js';
import { ALARM_NAMES, runDailyCheck, sendStartupNotifications } from '../src/background/worker.js';
import { STORAGE_KEYS, storageGet } from '../src/services/storage.js';

function createPersistentChromeStorage(initialData = {}) {
  const store = new Map(Object.entries(initialData));
  return {
    store,
    local: {
      get: (keys, cb) => {
        const result = {};
        for (const k of keys) {
          if (store.has(k)) result[k] = store.get(k);
        }
        cb(result);
      },
      set: (obj, cb) => {
        for (const [k, v] of Object.entries(obj)) {
          store.set(k, v);
        }
        if (cb) cb();
      },
    },
  };
}

function createListenerRegistry() {
  const listeners = [];
  return {
    addListener: (fn) => listeners.push(fn),
    emit: (...args) => Promise.all(listeners.map((fn) => fn(...args))),
    listeners,
  };
}

describe('Background Workflows (registerBackgroundListeners)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete globalThis.chrome;
  });

  it('initializes DNR rules on startup and reacts to Focus Mode storage changes', async () => {
    const syncLeetCode = vi.fn().mockResolvedValue({ ok: true });
    const syncFocus = vi.fn().mockResolvedValue({ ok: true });
    const storageChanged = createListenerRegistry();

    registerBackgroundListeners(
      {
        storage: { onChanged: storageChanged },
      },
      {
        syncLeetCodeNetworkRules: syncLeetCode,
        syncFocusModeNetworkRules: syncFocus,
        getFocusModeEnabled: async () => true,
      }
    );

    await vi.runAllTicks();
    expect(syncLeetCode).toHaveBeenCalledTimes(1);
    expect(syncFocus).toHaveBeenCalledWith(true);

    // Unrelated area or key does not trigger sync
    await storageChanged.emit({ [STORAGE_KEYS.FOCUS_MODE]: { newValue: false } }, 'sync');
    await storageChanged.emit({ other_key: { newValue: true } }, 'local');
    expect(syncFocus).toHaveBeenCalledTimes(1);

    // Local FOCUS_MODE change triggers DNR rule update
    await storageChanged.emit({ [STORAGE_KEYS.FOCUS_MODE]: { newValue: false } }, 'local');
    expect(syncFocus).toHaveBeenCalledWith(false);
  });

  it('debounces leetcode cookie updates and triggers daily check only on explicit LEETCODE_SESSION change', async () => {
    const syncLeetCode = vi.fn().mockResolvedValue({ ok: true });
    const checkDaily = vi.fn().mockResolvedValue({});
    const cookiesChanged = createListenerRegistry();

    registerBackgroundListeners(
      {
        cookies: { onChanged: cookiesChanged },
      },
      {
        syncLeetCodeNetworkRules: syncLeetCode,
        syncFocusModeNetworkRules: vi.fn().mockResolvedValue({ ok: true }),
        getFocusModeEnabled: async () => false,
        runDailyCheck: checkDaily,
      }
    );

    syncLeetCode.mockClear();

    // Non-LeetCode cookies are ignored completely
    await cookiesChanged.emit({
      cause: 'explicit',
      cookie: { domain: '.youtube.com', name: 'LEETCODE_SESSION', value: 'x' },
    });
    vi.advanceTimersByTime(3000);
    expect(syncLeetCode).not.toHaveBeenCalled();

    // Multiple rapid csrftoken + session events debounce into a single sync + explicit daily check
    await cookiesChanged.emit({
      cause: 'overwrite',
      cookie: { domain: '.leetcode.com', name: 'csrftoken', value: 'csrf_1' },
    });
    await cookiesChanged.emit({
      cause: 'explicit',
      cookie: { domain: '.leetcode.com', name: 'LEETCODE_SESSION', value: 'sess_1' },
    });

    vi.advanceTimersByTime(1999);
    expect(syncLeetCode).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(syncLeetCode).toHaveBeenCalledTimes(1);
    expect(checkDaily).toHaveBeenCalledTimes(1);
  });

  it('routes alarms, notification clicks, and REFRESH_DATA messages correctly', async () => {
    const syncLeetCode = vi.fn().mockResolvedValue({ ok: true });
    const checkDaily = vi.fn().mockResolvedValue({ user: { username: 'dev' } });
    const checkContest = vi.fn().mockResolvedValue([{ title: 'Weekly Contest 480' }]);
    const alarmsOnAlarm = createListenerRegistry();
    const notificationsOnClicked = createListenerRegistry();
    const runtimeOnMessage = createListenerRegistry();
    const tabsCreate = vi.fn();
    const setupAlarmsMock = vi.fn();

    registerBackgroundListeners(
      {
        alarms: { onAlarm: alarmsOnAlarm },
        notifications: { onClicked: notificationsOnClicked },
        tabs: { create: tabsCreate },
        runtime: { onMessage: runtimeOnMessage },
      },
      {
        setupAlarms: setupAlarmsMock,
        syncLeetCodeNetworkRules: syncLeetCode,
        syncFocusModeNetworkRules: vi.fn().mockResolvedValue({ ok: true }),
        getFocusModeEnabled: async () => false,
        runDailyCheck: checkDaily,
        runContestCheck: checkContest,
      }
    );

    expect(setupAlarmsMock).toHaveBeenCalledTimes(1);

    // Daily alarm syncs rules before daily check
    await alarmsOnAlarm.emit({ name: ALARM_NAMES.DAILY_CHECK });
    await Promise.resolve();
    expect(checkDaily).toHaveBeenCalledTimes(1);

    // Contest alarm runs contest check
    await alarmsOnAlarm.emit({ name: ALARM_NAMES.CONTEST_CHECK });
    expect(checkContest).toHaveBeenCalledTimes(1);

    // Notification clicks open contest page, login page, daily problem, or home fallback
    await notificationsOnClicked.emit('contest_weekly-contest-480');
    expect(tabsCreate).toHaveBeenCalledWith({ url: 'https://leetcode.com/contest/weekly-contest-480' });

    await notificationsOnClicked.emit('login_reminder_2026-11-13');
    expect(tabsCreate).toHaveBeenCalledWith({ url: 'https://leetcode.com/accounts/login/' });

    await notificationsOnClicked.emit('daily_2026-11-13');
    expect(tabsCreate).toHaveBeenCalledWith({ url: 'https://leetcode.com/problemset/' });

    await notificationsOnClicked.emit('general_alert');
    expect(tabsCreate).toHaveBeenCalledWith({ url: 'https://leetcode.com' });

    // REFRESH_DATA runtime message returns async success payload
    const sendResponse = vi.fn();
    const keepChannelOpen = runtimeOnMessage.listeners[0]({ type: 'REFRESH_DATA' }, {}, sendResponse);
    expect(keepChannelOpen).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        dailyData: { user: { username: 'dev' } },
        contests: [{ title: 'Weekly Contest 480' }],
      });
    });
  });

  it('triggers sendStartupNotifications on runtime.onStartup', async () => {
    const runtimeOnStartup = createListenerRegistry();
    const sendStartupMock = vi.fn().mockResolvedValue(undefined);

    registerBackgroundListeners(
      {
        runtime: { onStartup: runtimeOnStartup },
      },
      {
        syncLeetCodeNetworkRules: vi.fn().mockResolvedValue({ ok: true }),
        syncFocusModeNetworkRules: vi.fn().mockResolvedValue({ ok: true }),
        sendStartupNotifications: sendStartupMock,
      }
    );

    await runtimeOnStartup.emit();
    expect(sendStartupMock).toHaveBeenCalledTimes(1);
  });
});

describe('sendStartupNotifications', () => {
  it('notifies pending daily challenge and upcoming contest when signed in', async () => {
    const mockNotifications = { create: vi.fn() };
    const mockStorage = new Map();

    await sendStartupNotifications({
      force: true,
      notificationsApi: mockNotifications,
      storageGet: async (k) => mockStorage.get(k),
      storageSet: async (k, v) => mockStorage.set(k, v),
      fetchUserStatus: async () => ({ isSignedIn: true, username: 'testuser' }),
      fetchDailyChallenge: async () => ({
        date: '2026-11-13',
        title: 'Merge Intervals',
        difficulty: 'Medium',
        isSolved: false,
      }),
      fetchUpcomingContests: async () => [
        {
          title: 'Biweekly Contest 155',
          titleSlug: 'biweekly-contest-155',
          startTimeMs: Date.now() + 3600000 * 5,
        },
      ],
    });

    expect(mockNotifications.create).toHaveBeenCalledWith(
      'daily_2026-11-13',
      expect.objectContaining({
        title: '⚡ LeetCode Daily Challenge',
        message: expect.stringContaining('Merge Intervals'),
      })
    );

    expect(mockNotifications.create).toHaveBeenCalledWith(
      'contest_biweekly-contest-155',
      expect.objectContaining({
        title: '🏆 Upcoming Contest: Biweekly Contest 155',
        message: expect.stringMatching(/Contest starts in (?:4h 59m|5h 0m)/),
      })
    );

    const today = new Date().toISOString().split('T')[0];
    expect(mockStorage.get(STORAGE_KEYS.LAST_STARTUP_NOTIF_DATE)).toBe(today);
  });

  it('notifies user to log in when not signed in', async () => {
    const mockNotifications = { create: vi.fn() };
    const mockStorage = new Map();

    await sendStartupNotifications({
      force: true,
      notificationsApi: mockNotifications,
      storageGet: async (k) => mockStorage.get(k),
      storageSet: async (k, v) => mockStorage.set(k, v),
      fetchUserStatus: async () => ({ isSignedIn: false }),
      fetchDailyChallenge: async () => null,
      fetchUpcomingContests: async () => [],
    });

    const today = new Date().toISOString().split('T')[0];
    expect(mockNotifications.create).toHaveBeenCalledWith(
      `login_reminder_${today}`,
      expect.objectContaining({
        title: '🔑 Log in to LeetCode',
        message: expect.stringContaining('Log in to sync your active streak'),
      })
    );
  });
});

describe('Upgrade Data Preservation (v1.0.8 -> v1.0.9)', () => {
  afterEach(() => {
    delete globalThis.chrome;
  });

  it('preserves all v1.0.8 stored preferences, caches, coins, and focus lock across upgrade', async () => {
    const preUpgradeData = {
      [STORAGE_KEYS.FOCUS_MODE]: true,
      [STORAGE_KEYS.SOLVE_BEFORE_SCROLL]: true,
      [STORAGE_KEYS.AUTO_FOCUS_LOCKED]: true,
      [STORAGE_KEYS.LAST_COIN_CLAIM]: '2026-11-11',
      [STORAGE_KEYS.NOTIFIED_CONTESTS]: { 'weekly-contest-450': 1794400000000 },
      [STORAGE_KEYS.CACHED_USER]: {
        isSignedIn: true,
        username: 'The-Boss',
        points: 1894,
        currentStreak: 4,
      },
      [STORAGE_KEYS.CACHED_DAILY]: {
        date: '2026-11-11',
        title: 'Two Sum',
        isSolved: false,
      },
    };

    const persistentStorage = createPersistentChromeStorage(preUpgradeData);
    globalThis.chrome = {
      storage: { local: persistentStorage.local },
      runtime: { lastError: null, getManifest: () => ({ version: '1.0.9' }) },
    };

    const syncLeetCode = vi.fn().mockResolvedValue({ ok: true });
    const syncFocus = vi.fn().mockResolvedValue({ ok: true });

    // Even if LeetCode API fails right after upgrade (e.g. offline), cached state & prefs must survive
    await handleInstalled(
      { reason: 'update', previousVersion: '1.0.8' },
      {
        currentVersion: '1.0.9',
        syncLeetCodeNetworkRules: syncLeetCode,
        syncFocusModeNetworkRules: syncFocus,
        runDailyCheck: () =>
          runDailyCheck({
            fetchDailyChallenge: vi.fn().mockRejectedValue(new Error('Offline during update')),
            fetchUserStatus: vi.fn().mockRejectedValue(new Error('Offline during update')),
            updateBadge: vi.fn().mockResolvedValue(undefined),
            syncFocusRules: syncFocus,
          }),
        runContestCheck: vi.fn().mockResolvedValue([]),
      }
    );

    // Every single pre-existing v1.0.8 key must remain intact
    expect(await storageGet(STORAGE_KEYS.FOCUS_MODE)).toBe(true);
    expect(await storageGet(STORAGE_KEYS.SOLVE_BEFORE_SCROLL)).toBe(true);
    expect(await storageGet(STORAGE_KEYS.AUTO_FOCUS_LOCKED)).toBe(true);
    expect(await storageGet(STORAGE_KEYS.LAST_COIN_CLAIM)).toBe('2026-11-11');
    expect(await storageGet(STORAGE_KEYS.NOTIFIED_CONTESTS)).toEqual({
      'weekly-contest-450': 1794400000000,
    });
    expect(await storageGet(STORAGE_KEYS.CACHED_DAILY)).toEqual(preUpgradeData[STORAGE_KEYS.CACHED_DAILY]);

    const upgradedUser = await storageGet(STORAGE_KEYS.CACHED_USER);
    expect(upgradedUser.username).toBe('The-Boss');
    expect(upgradedUser.currentStreak).toBe(4);
    expect(upgradedUser.points).toBe(1894);

    // Focus rules re-synced immediately on update
    expect(syncFocus).toHaveBeenCalledWith(true);

    // Non-destructive upgrade metadata recorded
    const meta = await storageGet(STORAGE_KEYS.EXTENSION_META);
    expect(meta.previousVersion).toBe('1.0.8');
    expect(meta.currentVersion).toBe('1.0.9');
  });
});

describe('Web Bridge & Remote Timer Workflows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete globalThis.chrome;
  });

  it('handles GET_STATUS, START_FOCUS_TIMER, and STOP_FOCUS_TIMER commands via bridge', async () => {
    const runtimeOnMessage = createListenerRegistry();
    const syncFocus = vi.fn().mockResolvedValue({ ok: true });
    const tabsSendMessage = vi.fn().mockResolvedValue(undefined);
    const mockTabsQuery = vi.fn((_query, cb) => cb([{ id: 101 }, { id: 102 }]));

    const persistentStorage = createPersistentChromeStorage({
      [STORAGE_KEYS.CACHED_USER]: { username: 'The-Boss', currentStreak: 12 },
      [STORAGE_KEYS.FOCUS_MODE]: false,
      [STORAGE_KEYS.SOLVE_BEFORE_SCROLL]: false,
    });

    globalThis.chrome = {
      storage: { local: persistentStorage.local },
      runtime: { lastError: null },
    };

    registerBackgroundListeners(
      {
        runtime: { onMessage: runtimeOnMessage },
        tabs: { query: mockTabsQuery, sendMessage: tabsSendMessage },
      },
      {
        syncLeetCodeNetworkRules: vi.fn().mockResolvedValue({ ok: true }),
        syncFocusModeNetworkRules: syncFocus,
        getFocusModeEnabled: async () => false,
      }
    );

    // 1. GET_STATUS
    const statusRes = vi.fn();
    runtimeOnMessage.listeners[0]({ source: 'LEETING_WEB_BRIDGE', type: 'GET_STATUS' }, {}, statusRes);
    await vi.waitFor(() => {
      expect(statusRes).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true,
          version: '1.0.9',
          user: expect.objectContaining({ username: 'The-Boss' }),
          focusMode: false,
        })
      );
    });

    // 2. START_FOCUS_TIMER
    const timerRes = vi.fn();
    runtimeOnMessage.listeners[0](
      {
        source: 'LEETING_WEB_BRIDGE',
        type: 'START_FOCUS_TIMER',
        payload: { durationMinutes: 25, startedAt: 1000, endTime: 1501000 },
      },
      {},
      timerRes
    );
    await vi.waitFor(() => {
      expect(timerRes).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          focusMode: true,
          timer: expect.objectContaining({ isActive: true, durationMinutes: 25 }),
        })
      );
    });
    expect(syncFocus).toHaveBeenCalledWith(true);

    // 3. STOP_FOCUS_TIMER
    const stopRes = vi.fn();
    runtimeOnMessage.listeners[0](
      { source: 'LEETING_WEB_BRIDGE', type: 'STOP_FOCUS_TIMER' },
      {},
      stopRes
    );
    await vi.waitFor(() => {
      expect(stopRes).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          focusMode: false,
          timer: expect.objectContaining({ isActive: false }),
        })
      );
    });
    expect(syncFocus).toHaveBeenCalledWith(false);
  });
});
