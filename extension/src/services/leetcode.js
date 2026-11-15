export const LEETCODE_BASE_URL = 'https://leetcode.com';
export const GRAPHQL_ENDPOINT = `${LEETCODE_BASE_URL}/graphql`;

/**
 * Extract GraphQL operation name from a query string
 */
export function extractOperationName(query) {
  if (!query || typeof query !== 'string') return undefined;
  const match = query.match(/(?:query|mutation)\s+([A-Za-z0-9_]+)/);
  return match ? match[1] : undefined;
}

/**
 * Execute a GraphQL query against LeetCode's endpoint
 */
export async function executeGraphQL(query, variables = {}, fetchFn = fetch, operationNameOverride = null) {
  const operationName = operationNameOverride || extractOperationName(query);
  const payload = { query, variables };
  if (operationName) {
    payload.operationName = operationName;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (typeof chrome !== 'undefined' && chrome.cookies?.get) {
    try {
      const cookie = await new Promise((resolve) => {
        chrome.cookies.get({ url: LEETCODE_BASE_URL, name: 'csrftoken' }, resolve);
      });
      if (cookie && cookie.value) {
        headers['x-csrftoken'] = cookie.value;
      }
    } catch {
      // Ignore if cookies permission isn't available or fails
    }
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  try {
    const fetchOptions = {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    };
    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    const response = await fetchFn(GRAPHQL_ENDPOINT, fetchOptions);

    if (!response.ok) {
      throw new Error(`LeetCode API HTTP error: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      console.warn('LeetCode GraphQL returned errors:', json.errors);
    }
    return json.data || null;
  } catch (error) {
    console.error('LeetCode GraphQL request failed:', error);
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Fetch max yearly streaks for prior activeYears in a single aliased GraphQL query
 */
async function fetchHistoricalMaxStreak(username, activeYears, currentYear, fetchFn = fetch) {
  const otherYears = (activeYears || []).filter((y) => Number.isInteger(y) && y !== currentYear);
  if (otherYears.length === 0) return 0;

  const aliases = otherYears
    .map((y) => `y${y}: userCalendar(year: ${y}) { streak }`)
    .join(' ');
  const query = `
    query userYearlyStreaks($username: String!) {
      matchedUser(username: $username) {
        ${aliases}
      }
    }
  `;

  try {
    const data = await executeGraphQL(query, { username }, fetchFn);
    const matched = data?.matchedUser || {};
    let best = 0;
    for (const y of otherYears) {
      const s = matched[`y${y}`]?.streak || 0;
      if (s > best) best = s;
    }
    return best;
  } catch {
    return 0;
  }
}

/**
 * Fetch current authentication status & user profile summary (including streaks)
 */
export async function fetchUserStatus(fetchFn = fetch) {
  let hasSessionCookie = false;
  if (typeof chrome !== 'undefined' && chrome.cookies?.getAll) {
    try {
      const cookies = await new Promise((resolve) => {
        chrome.cookies.getAll({ domain: 'leetcode.com' }, resolve);
      });
      hasSessionCookie = Boolean(cookies && cookies.some((c) => c.name === 'LEETCODE_SESSION' && c.value));
    } catch {
      // Ignore
    }
  }

  const query = `
    query globalData {
      userStatus {
        userId
        username
        isSignedIn
        isPremium
      }
    }
  `;

  const data = await executeGraphQL(query, {}, fetchFn);
  if (!data || !data.userStatus) {
    return { isSignedIn: false, hasSessionCookie, username: null, points: 0, avatar: null };
  }

  const status = data.userStatus;
  const isSignedIn = Boolean(status.isSignedIn && status.username);

  let avatar = null;
  let points = 0;
  let ranking = null;
  let submissionCalendar = null;
  let difficultyStats = null;
  let currentStreak = 0;
  let longestStreak = 0;
  let totalActiveDays = 0;
  let streakDebug = null;

  if (isSignedIn && status.username) {
    try {
      const currentYear = new Date().getFullYear();
      const profileQuery = `
        query getUserProfile($username: String!, $year: Int) {
          matchedUser(username: $username) {
            username
            contributions {
              points
            }
            profile {
              userAvatar
              ranking
            }
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            userCalendar(year: $year) {
              streak
              totalActiveDays
              submissionCalendar
            }
          }
        }
      `;
      const [profileData, activeCount] = await Promise.all([
        executeGraphQL(profileQuery, { username: status.username, year: currentYear }, fetchFn),
        fetchActiveStreakCounter(fetchFn),
      ]);
      const user = profileData?.matchedUser;

      if (user) {
        points = user.contributions?.points || 0;
        avatar = user.profile?.userAvatar || null;
        ranking = user.profile?.ranking || null;

        if (Array.isArray(user.submitStatsGlobal?.acSubmissionNum)) {
          difficultyStats = {};
          user.submitStatsGlobal.acSubmissionNum.forEach((item) => {
            difficultyStats[item.difficulty.toLowerCase()] = item.count;
          });
        }

        const calendar = user.userCalendar;
        if (calendar) {
          submissionCalendar = calendar.submissionCalendar || null;
          totalActiveDays = calendar.totalActiveDays || 0;
          const calendarStreak = calculateCurrentStreak(calendar.submissionCalendar);
          currentStreak = Math.max(activeCount || 0, calendarStreak);

          longestStreak = Math.max(
            calendar.streak || 0,
            calculateLongestStreak(calendar.submissionCalendar),
            currentStreak
          );

          if (currentStreak === 0) {
            const days = getUniqueSubmissionDays(calendar.submissionCalendar);
            streakDebug = `counter=${activeCount}, calStreak=${calendarStreak}, days=${days.length}`;
          }
        } else {
          streakDebug = `calendar=null, counter=${activeCount}`;
        }
      } else {
        streakDebug = `matchedUser=null, counter=${activeCount}`;
      }
    } catch (err) {
      console.warn('Could not fetch user profile details:', err);
      streakDebug = `err=${err.message}`;
    }
  }

  return {
    isSignedIn,
    hasSessionCookie,
    userId: status.userId || null,
    username: status.username || null,
    points,
    avatar,
    ranking,
    currentStreak,
    longestStreak,
    totalActiveDays,
    submissionCalendar,
    difficultyStats,
    streakDebug,
  };
}

/**
 * Fetch today's daily coding challenge details and whether the user solved it
 */
export async function fetchDailyChallenge(fetchFn = fetch) {
  const fullQuery = `
    query questionOfToday {
      activeDailyCodingChallengeQuestion {
        date
        userStatus
        link
        question {
          difficulty
          title
          titleSlug
          questionFrontendId
          topicTags {
            name
          }
        }
      }
    }
  `;

  let data = null;
  try {
    data = await executeGraphQL(fullQuery, {}, fetchFn);
  } catch (err) {
    // Fallback without userStatus if authenticated query fails
    const publicQuery = `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          link
          question {
            difficulty
            title
            titleSlug
            questionFrontendId
            topicTags {
              name
            }
          }
        }
      }
    `;
    data = await executeGraphQL(publicQuery, {}, fetchFn);
  }

  const challenge = data?.activeDailyCodingChallengeQuestion;

  if (!challenge || !challenge.question) {
    return null;
  }

  const isSolved = challenge.userStatus === 'Finish';
  const link = challenge.link.startsWith('http')
    ? challenge.link
    : `${LEETCODE_BASE_URL}${challenge.link}`;

  return {
    date: challenge.date,
    isSolved,
    title: challenge.question.title,
    titleSlug: challenge.question.titleSlug,
    frontendId: challenge.question.questionFrontendId,
    difficulty: challenge.question.difficulty,
    link,
    topicTags: (challenge.question.topicTags || []).map((t) => t.name),
  };
}

/**
 * Parse LeetCode submissionCalendar into sorted unique UTC day strings (YYYY-MM-DD)
 */
export function getUniqueSubmissionDays(submissionCalendar) {
  if (!submissionCalendar) return [];

  let calendar = submissionCalendar;
  if (typeof calendar === 'string') {
    try {
      calendar = JSON.parse(calendar);
    } catch {
      return [];
    }
  }

  const timestamps = Object.keys(calendar)
    .map((ts) => parseInt(ts, 10))
    .filter((ts) => !Number.isNaN(ts) && calendar[ts] > 0)
    .sort((a, b) => a - b);

  if (timestamps.length === 0) return [];

  return Array.from(
    new Set(
      timestamps.map((ts) => {
        const d = new Date(ts * 1000);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      })
    )
  ).sort();
}

/**
 * Calculate the longest consecutive active streak from LeetCode submissionCalendar
 */
export function calculateLongestStreak(submissionCalendar) {
  const uniqueDays = getUniqueSubmissionDays(submissionCalendar);
  if (uniqueDays.length === 0) return 0;

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  return maxStreak;
}

/**
 * Calculate current consecutive active streak ending today or yesterday (UTC)
 */
export function calculateCurrentStreak(submissionCalendar, nowDate = new Date()) {
  const uniqueDays = getUniqueSubmissionDays(submissionCalendar);
  if (uniqueDays.length === 0) return 0;

  const daySet = new Set(uniqueDays);
  const todayUtc = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate()));
  const formatUtc = (d) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

  let cursor = new Date(todayUtc);
  if (!daySet.has(formatUtc(cursor))) {
    // Check yesterday (streak is still alive if today isn't completed yet)
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!daySet.has(formatUtc(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (daySet.has(formatUtc(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

/**
 * Fetch active streak counter (exact flame icon number for logged-in user)
 */
export async function fetchActiveStreakCounter(fetchFn = fetch) {
  const query = `
    query getStreakCounter {
      streakCounter {
        streakCount
        daysSkipped
        currentDayCompleted
      }
    }
  `;

  try {
    const data = await executeGraphQL(query, {}, fetchFn);
    if (data && data.streakCounter && typeof data.streakCounter.streakCount === 'number') {
      return data.streakCounter.streakCount;
    }
  } catch {
    // Fallback gracefully
  }
  return null;
}

/**
 * Fetch user's current streak and all-time longest streak
 */
export async function fetchUserStreak(username, year = new Date().getFullYear(), fetchFn = fetch) {
  if (!username) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const calendarQuery = `
    query userProfileCalendar($username: String!, $year: Int) {
      matchedUser(username: $username) {
        userCalendar(year: $year) {
          activeYears
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `;

  const [calendarData, activeCounter] = await Promise.all([
    executeGraphQL(calendarQuery, { username, year }, fetchFn),
    fetchActiveStreakCounter(fetchFn),
  ]);

  const calendar = calendarData?.matchedUser?.userCalendar;

  if (!calendar) {
    return {
      currentStreak: activeCounter !== null ? activeCounter : 0,
      longestStreak: activeCounter !== null ? activeCounter : 0,
      totalActiveDays: 0,
    };
  }

  let longestStreak = Math.max(
    calendar.streak || 0,
    calculateLongestStreak(calendar.submissionCalendar)
  );

  const histMax = await fetchHistoricalMaxStreak(username, calendar.activeYears, year, fetchFn);
  if (histMax > longestStreak) {
    longestStreak = histMax;
  }

  const currentStreak =
    activeCounter !== null
      ? activeCounter
      : calculateCurrentStreak(calendar.submissionCalendar);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalActiveDays: calendar.totalActiveDays || 0,
  };
}

/**
 * Fetch upcoming contests (Weekly & Biweekly)
 */
export async function fetchUpcomingContests(fetchFn = fetch) {
  const query = `
    query upcomingContests {
      upcomingContests {
        title
        titleSlug
        startTime
        duration
      }
    }
  `;

  const data = await executeGraphQL(query, {}, fetchFn);
  const contests = data?.upcomingContests || [];
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return contests
    .filter((contest) => contest.startTime > nowInSeconds)
    .map((contest) => ({
      title: contest.title,
      titleSlug: contest.titleSlug,
      startTime: contest.startTime,
      startTimeMs: contest.startTime * 1000,
      duration: contest.duration,
      url: `${LEETCODE_BASE_URL}/contest/${contest.titleSlug}`,
    }))
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Claim daily check-in LeetCoins
 */
export async function claimDailyCoins(fetchFn = fetch) {
  const mutation = `
    mutation checkin {
      checkin {
        checkedIn
        ok
        error
      }
    }
  `;

  try {
    const data = await executeGraphQL(mutation, {}, fetchFn);
    const result = data?.checkin;

    if (!result) {
      return { success: false, checkedIn: false, error: 'No response from checkin API' };
    }

    return {
      success: Boolean(result.ok),
      checkedIn: Boolean(result.checkedIn),
      error: result.error || null,
    };
  } catch (error) {
    return {
      success: false,
      checkedIn: false,
      error: error.message || 'Checkin request failed',
    };
  }
}
