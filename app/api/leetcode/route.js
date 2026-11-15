import { NextResponse } from 'next/server';

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const DAILY_QUERY = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      userStatus
      link
      question {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
        }
      }
    }
  }
`;

const CONTESTS_QUERY = `
  query upcomingContests {
    upcomingContests {
      title
      titleSlug
      startTime
      duration
    }
  }
`;

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!, $year: Int) {
    matchedUser(username: $username) {
      username
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    const fetches = [
      fetch(LEETCODE_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DAILY_QUERY }),
        next: { revalidate: 60 },
      }),
      fetch(LEETCODE_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: CONTESTS_QUERY }),
        next: { revalidate: 120 },
      }),
    ];

    if (username) {
      const currentYear = new Date().getFullYear();
      fetches.push(
        fetch(LEETCODE_GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: USER_PROFILE_QUERY,
            variables: { username, year: currentYear },
          }),
          next: { revalidate: 60 },
        })
      );
    }

    const [dailyRes, contestRes, userRes] = await Promise.allSettled(fetches);

    let daily = null;
    let contests = [];
    let user = null;

    if (dailyRes.status === 'fulfilled' && dailyRes.value.ok) {
      const dailyJson = await dailyRes.value.json();
      const rawDaily = dailyJson?.data?.activeDailyCodingChallengeQuestion;
      if (rawDaily && rawDaily.question) {
        daily = {
          date: rawDaily.date,
          isSolved: rawDaily.userStatus === 'Finish',
          title: rawDaily.question.title,
          titleSlug: rawDaily.question.titleSlug,
          frontendId: rawDaily.question.questionFrontendId,
          difficulty: rawDaily.question.difficulty,
          link: rawDaily.link.startsWith('http')
            ? rawDaily.link
            : `https://leetcode.com${rawDaily.link}`,
          topicTags: (rawDaily.question.topicTags || []).map((t) => t.name),
        };
      }
    }

    if (contestRes.status === 'fulfilled' && contestRes.value.ok) {
      const contestJson = await contestRes.value.json();
      const rawContests = contestJson?.data?.upcomingContests || [];
      const nowInSeconds = Math.floor(Date.now() / 1000);
      contests = rawContests
        .filter((c) => c.startTime > nowInSeconds)
        .map((c) => ({
          title: c.title,
          titleSlug: c.titleSlug,
          startTime: c.startTime,
          startTimeMs: c.startTime * 1000,
          duration: c.duration,
          durationMinutes: Math.round(c.duration / 60),
          url: `https://leetcode.com/contest/${c.titleSlug}`,
        }))
        .sort((a, b) => a.startTime - b.startTime);
    }

    if (userRes && userRes.status === 'fulfilled' && userRes.value.ok) {
      const userJson = await userRes.value.json();
      const matched = userJson?.data?.matchedUser;
      if (matched) {
        let difficultyStats = null;
        if (Array.isArray(matched.submitStatsGlobal?.acSubmissionNum)) {
          difficultyStats = {};
          matched.submitStatsGlobal.acSubmissionNum.forEach((item) => {
            difficultyStats[item.difficulty.toLowerCase()] = item.count;
          });
        }
        const totalSolved = difficultyStats
          ? (difficultyStats.all ?? ((difficultyStats.easy || 0) + (difficultyStats.medium || 0) + (difficultyStats.hard || 0)))
          : 0;
        user = {
          username: matched.username,
          avatar: matched.profile?.userAvatar || null,
          ranking: matched.profile?.ranking || null,
          totalSolved,
          submissionCalendar: matched.userCalendar?.submissionCalendar || null,
          totalActiveDays: matched.userCalendar?.totalActiveDays || 0,
          streak: matched.userCalendar?.streak || 0,
          difficultyStats,
        };
      }
    }

    return NextResponse.json({
      success: true,
      daily,
      contests,
      user,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch LeetCode GraphQL data',
      },
      { status: 500 }
    );
  }
}
