import { describe, it, expect, vi } from 'vitest';
import {
  calculateLongestStreak,
  calculateCurrentStreak,
  fetchUserStreak,
  fetchUserStatus,
  fetchDailyChallenge,
  fetchUpcomingContests,
  claimDailyCoins,
  extractOperationName,
} from '../src/services/leetcode.js';

describe('extractOperationName', () => {
  it('extracts query and mutation operation names', () => {
    expect(extractOperationName('query questionOfToday { activeDailyCodingChallengeQuestion { date } }')).toBe('questionOfToday');
    expect(extractOperationName('mutation checkin { checkin { ok } }')).toBe('checkin');
    expect(extractOperationName('query getUserProfile($username: String!) { matchedUser }')).toBe('getUserProfile');
  });
});

describe('calculateLongestStreak', () => {
  it('returns 0 for empty or invalid input', () => {
    expect(calculateLongestStreak(null)).toBe(0);
    expect(calculateLongestStreak({})).toBe(0);
    expect(calculateLongestStreak('invalid json')).toBe(0);
  });

  it('calculates single day streak correctly', () => {
    const calendar = { '1700000000': 3 };
    expect(calculateLongestStreak(calendar)).toBe(1);
  });

  it('handles multiple submissions on the same day without inflating streak', () => {
    const calendar = {
      '1700000000': 1,
      '1700003600': 2,
    };
    expect(calculateLongestStreak(calendar)).toBe(1);
  });

  it('calculates consecutive day streaks correctly', () => {
    const base = 1700006400;
    const calendar = {
      [base]: 1,
      [base + 86400]: 2,
      [base + 86400 * 2]: 1,
      [base + 86400 * 5]: 1,
      [base + 86400 * 6]: 1,
    };
    expect(calculateLongestStreak(calendar)).toBe(3);
  });
});

describe('fetchUserStatus', () => {
  it('parses signed in user correctly', async () => {
    const currentYear = new Date().getFullYear();
    const mockFetch = vi.fn().mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.operationName === 'globalData') {
        return {
          ok: true,
          json: async () => ({
            data: {
              userStatus: {
                userId: '12345',
                isSignedIn: true,
                username: 'coder_test',
                isPremium: false,
              },
            },
          }),
        };
      }
      if (body.operationName === 'getUserProfile') {
        return {
          ok: true,
          json: async () => ({
            data: {
              matchedUser: {
                username: 'coder_test',
                contributions: { points: 450 },
                profile: { userAvatar: 'https://leetcode.com/avatar.jpg' },
                userCalendar: {
                  activeYears: [currentYear],
                  streak: 12,
                  totalActiveDays: 40,
                  submissionCalendar: '{}',
                },
              },
            },
          }),
        };
      }
      if (body.operationName === 'getStreakCounter') {
        return {
          ok: true,
          json: async () => ({
            data: { streakCounter: { streakCount: 4 } },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: null }) };
    });

    const result = await fetchUserStatus(mockFetch);
    expect(result.isSignedIn).toBe(true);
    expect(result.username).toBe('coder_test');
    expect(result.points).toBe(450);
    expect(result.avatar).toBe('https://leetcode.com/avatar.jpg');
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(12);
    expect(result.totalActiveDays).toBe(40);
  });

  it('uses submissionCalendar current streak when streakCounter is 0', async () => {
    const todayTs = Math.floor(Date.now() / 1000);
    const yesterdayTs = todayTs - 86400;
    const mockFetch = vi.fn().mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.operationName === 'globalData') {
        return {
          ok: true,
          json: async () => ({
            data: { userStatus: { userId: '1', username: 'coder_test', isSignedIn: true } },
          }),
        };
      }
      if (body.operationName === 'getUserProfile') {
        return {
          ok: true,
          json: async () => ({
            data: {
              matchedUser: {
                username: 'coder_test',
                contributions: { points: 100 },
                profile: { userAvatar: null },
                userCalendar: {
                  streak: 5,
                  totalActiveDays: 10,
                  submissionCalendar: JSON.stringify({ [yesterdayTs]: 1, [todayTs]: 2 }),
                },
              },
            },
          }),
        };
      }
      if (body.operationName === 'getStreakCounter') {
        return {
          ok: true,
          json: async () => ({ data: { streakCounter: { streakCount: 0 } } }),
        };
      }
      return { ok: true, json: async () => ({ data: null }) };
    });

    const result = await fetchUserStatus(mockFetch);
    expect(result.currentStreak).toBe(2);
  });

  it('handles logged-out user gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          userStatus: {
            isSignedIn: false,
            username: '',
          },
        },
      }),
    });

    const result = await fetchUserStatus(mockFetch);
    expect(result.isSignedIn).toBe(false);
    expect(result.username).toBeNull();
    expect(result.points).toBe(0);
  });
});

describe('fetchDailyChallenge', () => {
  it('parses solved daily challenge correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          activeDailyCodingChallengeQuestion: {
            date: '2026-11-11',
            userStatus: 'Finish',
            link: '/problems/two-sum/',
            question: {
              questionId: '1',
              questionFrontendId: '1',
              title: 'Two Sum',
              titleSlug: 'two-sum',
              difficulty: 'Easy',
              topicTags: [{ name: 'Array' }, { name: 'Hash Table' }],
            },
          },
        },
      }),
    });

    const result = await fetchDailyChallenge(mockFetch);
    expect(result.isSolved).toBe(true);
    expect(result.title).toBe('Two Sum');
    expect(result.difficulty).toBe('Easy');
    expect(result.frontendId).toBe('1');
    expect(result.link).toBe('https://leetcode.com/problems/two-sum/');
    expect(result.topicTags).toEqual(['Array', 'Hash Table']);
  });

  it('marks pending challenge as unsolved', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          activeDailyCodingChallengeQuestion: {
            date: '2026-11-11',
            userStatus: 'NotStart',
            link: '/problems/median-of-two-sorted-arrays/',
            question: {
              questionId: '4',
              questionFrontendId: '4',
              title: 'Median of Two Sorted Arrays',
              titleSlug: 'median-of-two-sorted-arrays',
              difficulty: 'Hard',
              topicTags: [{ name: 'Binary Search' }],
            },
          },
        },
      }),
    });

    const result = await fetchDailyChallenge(mockFetch);
    expect(result.isSolved).toBe(false);
    expect(result.difficulty).toBe('Hard');
  });

  it('falls back to public query if authenticated query fails', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 499,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            activeDailyCodingChallengeQuestion: {
              date: '2026-11-11',
              link: '/problems/two-sum/',
              question: {
                questionFrontendId: '1',
                title: 'Two Sum',
                titleSlug: 'two-sum',
                difficulty: 'Easy',
                topicTags: [],
              },
            },
          },
        }),
      });

    const result = await fetchDailyChallenge(mockFetch);
    expect(result.title).toBe('Two Sum');
    expect(result.isSolved).toBe(false);
  });
});

describe('fetchUpcomingContests', () => {
  it('filters past contests and formats upcoming ones', async () => {
    const futureTimeInSeconds = Math.floor(Date.now() / 1000) + 3600;
    const pastTimeInSeconds = Math.floor(Date.now() / 1000) - 3600;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          upcomingContests: [
            {
              title: 'Past Contest',
              titleSlug: 'past-contest',
              startTime: pastTimeInSeconds,
              duration: 5400,
            },
            {
              title: 'Weekly Contest 450',
              titleSlug: 'weekly-contest-450',
              startTime: futureTimeInSeconds,
              duration: 5400,
            },
          ],
        },
      }),
    });

    const contests = await fetchUpcomingContests(mockFetch);
    expect(contests.length).toBe(1);
    expect(contests[0].title).toBe('Weekly Contest 450');
    expect(contests[0].url).toBe('https://leetcode.com/contest/weekly-contest-450');
  });
});

describe('claimDailyCoins', () => {
  it('returns success when checkin succeeds', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          checkin: {
            ok: true,
            checkedIn: true,
            error: null,
          },
        },
      }),
    });

    const result = await claimDailyCoins(mockFetch);
    expect(result.success).toBe(true);
    expect(result.checkedIn).toBe(true);
  });
});

describe('calculateCurrentStreak', () => {
  it('computes active streak ending yesterday if today is not yet submitted', () => {
    const now = new Date('2026-11-11T12:00:00Z');
    const y1 = Math.floor(new Date('2026-11-10T00:00:00Z').getTime() / 1000);
    const y2 = Math.floor(new Date('2026-11-09T00:00:00Z').getTime() / 1000);
    const calendar = { [y2]: 1, [y1]: 2 };

    expect(calculateCurrentStreak(calendar, now)).toBe(2);
  });

  it('computes active streak including today', () => {
    const now = new Date('2026-11-11T12:00:00Z');
    const t0 = Math.floor(new Date('2026-11-11T00:00:00Z').getTime() / 1000);
    const t1 = Math.floor(new Date('2026-11-10T00:00:00Z').getTime() / 1000);
    const calendar = { [t1]: 1, [t0]: 3 };

    expect(calculateCurrentStreak(calendar, now)).toBe(2);
  });

  it('returns 0 if streak is broken', () => {
    const now = new Date('2026-11-11T12:00:00Z');
    const old = Math.floor(new Date('2026-11-05T00:00:00Z').getTime() / 1000);
    expect(calculateCurrentStreak({ [old]: 1 }, now)).toBe(0);
  });
});

describe('fetchUserStreak', () => {
  it('fetches active streakCounter and all-time longest streak across activeYears', async () => {
    const mockFetch = vi.fn().mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.operationName === 'getStreakCounter') {
        return {
          ok: true,
          json: async () => ({
            data: { streakCounter: { streakCount: 3, daysSkipped: 0, currentDayCompleted: true } },
          }),
        };
      }
      if (body.variables.year === 2026) {
        return {
          ok: true,
          json: async () => ({
            data: {
              matchedUser: {
                userCalendar: {
                  activeYears: [2023, 2026],
                  streak: 11,
                  totalActiveDays: 93,
                  submissionCalendar: '{}',
                },
              },
            },
          }),
        };
      }
      if (body.operationName === 'userYearlyStreaks') {
        return {
          ok: true,
          json: async () => ({
            data: {
              matchedUser: {
                y2023: { streak: 24 },
              },
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: null }) };
    });

    const result = await fetchUserStreak('The-Boss', 2026, mockFetch);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(24);
    expect(result.totalActiveDays).toBe(93);
  });
});
