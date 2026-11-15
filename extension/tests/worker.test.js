import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ALARM_NAMES,
  updateBadge,
  setupAlarms,
  runDailyCheck,
  runContestCheck,
  enforceSolveBeforeScroll,
} from '../src/background/worker.js';
import {
  STORAGE_KEYS,
  storageSet,
  getFocusModeEnabled,
  setFocusModeEnabled,
  setSolveBeforeScrollEnabled,
  getAutoFocusLocked,
  setAutoFocusLocked,
} from '../src/services/storage.js';

describe('updateBadge', () => {
  it('sets green badge with streak count when solved', async () => {
    const mockAction = {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
    };

    await updateBadge(true, 14, mockAction);
    expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '14' });
    expect(mockAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#00b8a3' });
  });

  it('caps streak display at 999+', async () => {
    const mockAction = {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
    };

    await updateBadge(true, 1200, mockAction);
    expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '999+' });
  });

  it('sets red exclamation badge when challenge is unsolved', async () => {
    const mockAction = {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
    };

    await updateBadge(false, 0, mockAction);
    expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '!' });
    expect(mockAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#ff375f' });
  });

  it('clears badge when status is null', async () => {
    const mockAction = {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
    };

    await updateBadge(null, 0, mockAction);
    expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });
});

describe('setupAlarms', () => {
  it('registers daily and contest check alarms', () => {
    const mockAlarms = {
      create: vi.fn(),
    };

    setupAlarms(mockAlarms);
    expect(mockAlarms.create).toHaveBeenCalledWith(
      ALARM_NAMES.DAILY_CHECK,
      expect.objectContaining({ periodInMinutes: 30 })
    );
    expect(mockAlarms.create).toHaveBeenCalledWith(
      ALARM_NAMES.CONTEST_CHECK,
      expect.objectContaining({ periodInMinutes: 60 })
    );
  });
});

describe('runDailyCheck', () => {
  it('updates cache, badge, and triggers coin claim for logged-in user', async () => {
    const mockStatus = vi.fn().mockResolvedValue({
      isSignedIn: true,
      username: 'alice',
      points: 200,
    });
    const mockDaily = vi.fn().mockResolvedValue({
      date: '2026-11-11',
      isSolved: true,
      title: 'Two Sum',
    });
    const mockStreak = vi.fn().mockResolvedValue({
      currentStreak: 5,
      longestStreak: 10,
    });
    const mockSetBadge = vi.fn();

    const result = await runDailyCheck({
      fetchUserStatus: mockStatus,
      fetchDailyChallenge: mockDaily,
      fetchUserStreak: mockStreak,
      updateBadge: mockSetBadge,
    });

    expect(result.streak).toBe(5);
    expect(result.user.currentStreak).toBe(5);
    expect(result.user.longestStreak).toBe(10);
    expect(result.daily.title).toBe('Two Sum');
    expect(mockSetBadge).toHaveBeenCalledWith(true, 5);
  });
});

describe('runContestCheck', () => {
  beforeEach(async () => {
    await storageSet(STORAGE_KEYS.NOTIFIED_CONTESTS, {});
  });

  it('triggers notification when contest starts within 45 minutes', async () => {
    const contestStartsIn20Mins = Date.now() + 20 * 60 * 1000;
    const mockFetchContests = vi.fn().mockResolvedValue([
      {
        title: 'Biweekly Contest 150',
        titleSlug: 'biweekly-contest-150',
        startTimeMs: contestStartsIn20Mins,
      },
    ]);

    const mockNotifications = {
      create: vi.fn(),
    };

    const contests = await runContestCheck({
      fetchUpcomingContests: mockFetchContests,
      notificationsApi: mockNotifications,
    });

    expect(contests.length).toBe(1);
    expect(mockNotifications.create).toHaveBeenCalledWith(
      'contest_biweekly-contest-150',
      expect.objectContaining({
        title: '🏆 LeetCode Contest Alert!',
        message: expect.stringContaining('Biweekly Contest 150 starts in 20 minutes'),
      })
    );
  });
});

describe('enforceSolveBeforeScroll', () => {
  beforeEach(async () => {
    await setSolveBeforeScrollEnabled(false);
    await setAutoFocusLocked(false);
    await setFocusModeEnabled(false);
  });

  it('locks Focus Mode ON when Solve Before Scroll is enabled and daily is unsolved', async () => {
    await setSolveBeforeScrollEnabled(true);
    const syncFocusRules = vi.fn().mockResolvedValue(undefined);

    const state = await enforceSolveBeforeScroll({ isSolved: false }, { syncFocusRules });

    expect(state).toEqual({ focusMode: true, autoLocked: true });
    expect(await getFocusModeEnabled()).toBe(true);
    expect(await getAutoFocusLocked()).toBe(true);
    expect(syncFocusRules).toHaveBeenCalledWith(true);
  });

  it('unlocks Focus Mode automatically when daily challenge becomes solved', async () => {
    await setSolveBeforeScrollEnabled(true);
    await setFocusModeEnabled(true);
    await setAutoFocusLocked(true);
    const syncFocusRules = vi.fn().mockResolvedValue(undefined);

    const state = await enforceSolveBeforeScroll({ isSolved: true }, { syncFocusRules });

    expect(state).toEqual({ focusMode: false, autoLocked: false });
    expect(await getFocusModeEnabled()).toBe(false);
    expect(await getAutoFocusLocked()).toBe(false);
    expect(syncFocusRules).toHaveBeenCalledWith(false);
  });

  it('releases auto-lock when Solve Before Scroll is disabled', async () => {
    await setSolveBeforeScrollEnabled(false);
    await setFocusModeEnabled(true);
    await setAutoFocusLocked(true);

    const state = await enforceSolveBeforeScroll({ isSolved: false });

    expect(state).toEqual({ focusMode: true, autoLocked: false });
    expect(await getAutoFocusLocked()).toBe(false);
  });
});
