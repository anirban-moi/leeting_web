'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Calendar,
  Target,
  TrendingUp,
  Sparkles,
  Award,
  BarChart3,
  RefreshCw,
  Flame,
  CheckCircle2,
  Zap,
  Lock,
  LogIn,
} from 'lucide-react';
import { initialUserData } from '../../lib/mock-data';
import { useAuth } from '../../components/auth/AuthProvider';
import { useExtensionBridge } from '../../lib/services/extension-bridge';
import ActivityHeatmap from '../../components/activity/ActivityHeatmap';
import { useCountUp, useAnimatedProgress } from '../../lib/hooks/useCountUp';
import { hasUserLoggedInOnce, getCachedUserData, saveUserCache } from '../../lib/services/user-cache';

export default function ActivityPage() {
  const { isOnline, isSyncing, remoteUser, triggerSync } = useExtensionBridge();
  const { user, isCloudConnected } = useAuth();

  const [cachedUser, setCachedUser] = useState(null);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  const [localSyncing, setLocalSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  useEffect(() => {
    setIsClientReady(true);
    setHasLoggedIn(hasUserLoggedInOnce());
    setCachedUser(getCachedUserData());
  }, []);

  // Cache user data when signed in or when live extension data is detected
  useEffect(() => {
    if (isCloudConnected && user) {
      saveUserCache({
        email: user.email,
        username: user.username,
        avatar: user.imageUrl,
      });
      setHasLoggedIn(true);
    }
    if (remoteUser?.isSignedIn) {
      saveUserCache({
        username: remoteUser.username,
        streak: remoteUser.currentStreak,
        points: remoteUser.points,
        totalSolved: remoteUser.totalSolved,
        difficultyStats: remoteUser.difficultyStats,
        submissionCalendar: remoteUser.submissionCalendar,
      });
      setHasLoggedIn(true);
    }
  }, [isCloudConnected, user, remoteUser]);

  const isUserAvailable = Boolean(isCloudConnected || hasLoggedIn || remoteUser?.isSignedIn);

  // Fallback defaults from initialUserData
  const defaultDifficulty = initialUserData.difficultyStats;
  const defaultWeekly = initialUserData.weeklySummary;

  // Extract live user statistics if available (or from cached user)
  const effectiveUser = remoteUser || cachedUser;
  const username = effectiveUser?.username || initialUserData.profile.username;
  const currentStreak = effectiveUser?.currentStreak ?? effectiveUser?.streak ?? initialUserData.profile.streak;
  const longestStreak = effectiveUser?.longestStreak ?? 48;
  const totalActiveDays = effectiveUser?.totalActiveDays ?? 142;
  const submissionCalendar = effectiveUser?.submissionCalendar || null;

  // Build calendar map from submissionCalendar
  const calendarMap = useMemo(() => {
    if (!submissionCalendar) return null;
    let parsed = submissionCalendar;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return null;
      }
    }
    if (parsed && typeof parsed === 'object') {
      const map = {};
      for (const [ts, count] of Object.entries(parsed)) {
        const sec = Number(ts);
        const numCount = Number(count);
        if (!isNaN(sec) && numCount > 0) {
          const d = new Date(sec * 1000);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${day}`;
          map[key] = (map[key] || 0) + numCount;
        }
      }
      return map;
    }
    return null;
  }, [submissionCalendar]);

  // Compute this week's 7-day solving rhythm (Mon through Sun)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const todayDay = now.getDay();
    const distToMon = (todayDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = [];
    let totalSolved = 0;
    let activeDays = 0;
    let peakDay = { day: 'Wednesday', count: 0 };

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${day}`;
      const isToday = d.toDateString() === now.toDateString();
      const isFuture = d > now && !isToday;

      let count = 0;
      if (calendarMap && calendarMap[dateKey] !== undefined) {
        count = calendarMap[dateKey];
      } else if (!calendarMap && !isFuture) {
        const mockCounts = [3, 2, 6, 1, 4, 2, 0];
        count = mockCounts[i];
      }

      if (count > 0 && !isFuture) {
        totalSolved += count;
        activeDays++;
        if (count > peakDay.count) {
          peakDay = { day: dayLabels[i], count };
        }
      }

      days.push({
        day: dayLabels[i],
        dateKey,
        count: isFuture ? 0 : count,
        isToday,
        isFuture,
        goalMet: count >= 2,
      });
    }

    return {
      days,
      totalSolved: totalSolved > 0 ? totalSolved : defaultWeekly.problemsSolved,
      activeDays: activeDays > 0 ? activeDays : defaultWeekly.activeDays,
      totalDays: 7,
      peakDay: peakDay.count > 0 ? peakDay.day : defaultWeekly.mostActiveDay,
      goalCompletion: Math.min(
        100,
        Math.round(((totalSolved > 0 ? totalSolved : defaultWeekly.problemsSolved) / 14) * 100)
      ),
    };
  }, [calendarMap, defaultWeekly]);

  // Compute live Difficulty Stats
  const difficultyStats = useMemo(() => {
    const ds = effectiveUser?.difficultyStats;
    if (ds) {
      const easySolved = ds.easy ?? defaultDifficulty.easy.solved;
      const mediumSolved = ds.medium ?? defaultDifficulty.medium.solved;
      const hardSolved = ds.hard ?? defaultDifficulty.hard.solved;

      return {
        easy: {
          solved: easySolved,
          total: 840,
          percentage: Math.min(100, Math.round((easySolved / 840) * 100)),
        },
        medium: {
          solved: mediumSolved,
          total: 1750,
          percentage: Math.min(100, Math.round((mediumSolved / 1750) * 100)),
        },
        hard: {
          solved: hardSolved,
          total: 780,
          percentage: Math.min(100, Math.round((hardSolved / 780) * 100)),
        },
      };
    }
    return defaultDifficulty;
  }, [effectiveUser, defaultDifficulty]);

  // Dynamic animated metrics starting from 0 with oscillation for values < 50%
  const totalSolvedCount = (difficultyStats.easy.solved || 0) + (difficultyStats.medium.solved || 0) + (difficultyStats.hard.solved || 0);
  const animatedTotalSolved = useCountUp(totalSolvedCount, { duration: 1200 });

  // Easy tier
  const animatedEasySolved = useCountUp(difficultyStats.easy.solved, { duration: 1200 });
  const animatedEasyPct = useCountUp(difficultyStats.easy.percentage, { duration: 1350, decimals: 0, oscillate: difficultyStats.easy.percentage < 50 });
  const animatedEasyBar = useAnimatedProgress(difficultyStats.easy.percentage, { duration: 1350 });

  // Medium tier
  const animatedMediumSolved = useCountUp(difficultyStats.medium.solved, { duration: 1200 });
  const animatedMediumPct = useCountUp(difficultyStats.medium.percentage, { duration: 1350, decimals: 0, oscillate: difficultyStats.medium.percentage < 50 });
  const animatedMediumBar = useAnimatedProgress(difficultyStats.medium.percentage, { duration: 1350 });

  // Hard tier
  const animatedHardSolved = useCountUp(difficultyStats.hard.solved, { duration: 1200 });
  const animatedHardPct = useCountUp(difficultyStats.hard.percentage, { duration: 1350, decimals: 0, oscillate: difficultyStats.hard.percentage < 50 });
  const animatedHardBar = useAnimatedProgress(difficultyStats.hard.percentage, { duration: 1350 });

  // Handle manual sync trigger
  const handleManualSync = useCallback(async () => {
    setLocalSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await triggerSync();
      if (res?.user) {
        setSyncFeedback({ type: 'success', text: 'Activity matrix synced with LeetCode live!' });
      } else {
        // Fallback fetch via /api/leetcode
        const resWeb = await fetch(`/api/leetcode?username=${encodeURIComponent(username)}`);
        const json = await resWeb.json();
        if (json?.user) {
          setSyncFeedback({ type: 'success', text: 'Synced via LeetCode GraphQL public uplink!' });
        } else {
          setSyncFeedback({ type: 'info', text: 'Live sync refreshed (latest cached session)' });
        }
      }
    } catch {
      setSyncFeedback({ type: 'info', text: 'Extension bridge pinged. Ready for local updates.' });
    } finally {
      setLocalSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  }, [triggerSync, username]);

  // If user is not signed in and has never logged in, display blanked empty state
  if (isClientReady && !isUserAvailable) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Blanked Empty State Glass Card */}
        <div className="glass-obsidian rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-200 dark:border-white/[0.08] shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[60vh]">
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

          {/* Locked / Empty Activity Icon Badge */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-leeting-orange shadow-[0_0_30px_rgba(255,161,22,0.25)]">
              <Activity className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-gradient-to-br from-amber-500 to-[#ffa116] text-slate-950 shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            No Activity Data Available
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            You are currently browsing in guest mode. Sign in to your Leeting account to unlock your 365-day consistency matrix, weekly solving cadence, and algorithmic difficulty progression.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 transition-all hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Connect Activity</span>
            </Link>

            <Link
              href="/companies"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] text-sm font-semibold transition-colors"
            >
              <span>Explore Company Questions</span>
            </Link>
          </div>

          {/* Subtle blanked preview silhouette */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl opacity-40 pointer-events-none">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Weekly Solved</div>
              <div className="text-xl font-bold text-slate-500 mt-1 font-mono">--</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Current Streak</div>
              <div className="text-xl font-bold text-slate-500 mt-1 font-mono">--</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Consistency</div>
              <div className="text-xl font-bold text-slate-500 mt-1 font-mono">--</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Solved</div>
              <div className="text-xl font-bold text-slate-500 mt-1 font-mono">--</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-leeting-orange text-xs font-bold uppercase tracking-wider mb-1.5">
            <Activity className="w-4 h-4" />
            <span>Consistency Analytics & Heatmap</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Activity & Habit Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track daily problem cadence, 365-day heatmaps, algorithmic difficulty balance, and consistency velocity.
          </p>
        </div>

        {/* Sync Live Button & Connection Beacon */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>Bridge Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span>Cloud Ready</span>
            </div>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing || localSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-leeting-orange hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(255,161,22,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing || localSyncing ? 'animate-spin' : ''}`}
            />
            <span>{isSyncing || localSyncing ? 'Syncing...' : 'Sync Live Activity'}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{syncFeedback.text}</span>
        </div>
      )}

      {/* Top 4 Glass KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span>Weekly Volume</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono tracking-tight">
            {weeklyData.totalSolved}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5 font-bold">
            <TrendingUp className="w-3 h-3" /> Problems Solved This Week
          </span>
        </div>

        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span>Active Rhythm</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono tracking-tight">
            {weeklyData.activeDays}{' '}
            <span className="text-slate-500 dark:text-slate-400 text-lg font-normal">/ {weeklyData.totalDays}d</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 block font-medium">
            Consistency: {Math.round((weeklyData.activeDays / 7) * 100)}% active days
          </span>
        </div>

        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span>Peak Velocity Day</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono tracking-tight">
            {weeklyData.peakDay}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 block font-medium">Highest single-day volume</span>
        </div>

        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span>Weekly Goal</span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-leeting-green mt-2 font-mono tracking-tight">
            {weeklyData.goalCompletion}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 block font-bold">
            Target: 14 problems / week
          </span>
        </div>
      </div>

      {/* Target 3 Core: Interactive 365-Day Activity Heatmap Matrix */}
      <ActivityHeatmap
        submissionCalendar={submissionCalendar}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalActiveDays={totalActiveDays}
        username={username}
        isLive={Boolean(isOnline && submissionCalendar)}
      />

      {/* Difficulty Progression & Solved Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Progression (2 cols) */}
        <div className="glass-obsidian lg:col-span-2 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.06] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Algorithmic Difficulty Progression
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-slate-500 font-medium">Live solved distribution vs platform catalog</span>
                </div>
              </div>

              {/* Total Solved Badge */}
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                {animatedTotalSolved} Total Solved
              </span>
            </div>

            <div className="space-y-6">
              {/* Easy */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-teal-700 dark:text-[#00b8a3] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-[#00b8a3]" />
                    Easy Tier
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-mono font-medium">
                    {animatedEasySolved}{' '}
                    <span className="text-slate-500 dark:text-slate-400">/ {difficultyStats.easy.total}</span>
                    <span className="text-xs text-teal-700 dark:text-[#00b8a3] ml-1.5 font-bold">
                      ({animatedEasyPct}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-transparent overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_12px_rgba(0,184,163,0.4)]"
                    style={{ width: `${Math.max(4, animatedEasyBar)}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                    Medium Tier
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-mono font-medium">
                    {animatedMediumSolved}{' '}
                    <span className="text-slate-500 dark:text-slate-400">/ {difficultyStats.medium.total}</span>
                    <span className="text-xs text-amber-700 dark:text-amber-400 ml-1.5 font-bold">
                      ({animatedMediumPct}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-transparent overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(255,184,0,0.4)]"
                    style={{ width: `${Math.max(4, animatedMediumBar)}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                    Hard Tier
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-mono font-medium">
                    {animatedHardSolved}{' '}
                    <span className="text-slate-500 dark:text-slate-400">/ {difficultyStats.hard.total}</span>
                    <span className="text-xs text-rose-700 dark:text-rose-400 ml-1.5 font-bold">
                      ({animatedHardPct}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-transparent overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(255,55,95,0.4)]"
                    style={{ width: `${Math.max(4, animatedHardBar)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ratio Strip */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Optimal FAANG Ratio: 25% Easy · 55% Medium · 20% Hard
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Target Healthy Cadence</span>
          </div>
        </div>

        {/* AI Recommendation & Consistency Tier (1 col) */}
        <div className="glass-obsidian p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-white/[0.06] mb-6">
              <div className="p-2 rounded-xl bg-amber-500/10 text-leeting-orange border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">AI Strategy Insight</h3>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-medium">Curated adaptive guidance</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] backdrop-blur-md text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                <span className="text-amber-700 dark:text-amber-400 font-bold block mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Velocity Recommendation
                </span>
                You solved {difficultyStats.medium.solved} Medium problems. Solve 3 more Medium Graph / Dynamic Programming questions this week to boost your interview coverage to 30%.
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] backdrop-blur-md text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Streak Protection
                </span>
                Your active streak is {currentStreak} days! Solve today&apos;s daily challenge early to safeguard your position in the top 5% consistency tier.
              </div>
            </div>
          </div>

          <div className="p-3.5 mt-6 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/[0.06] border border-emerald-500/25 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span className="font-semibold">Consistency Tier</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">Diamond · 94.2 Percentile</span>
          </div>
        </div>
      </div>

      {/* Weekly Daily Volume Bars (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Daily Solving Rhythm (This Week)
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-500 font-medium">Live problems completed per calendar day</span>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
            {weeklyData.totalSolved} Total Solved
          </span>
        </div>

        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {weeklyData.days.map((d) => (
            <div key={d.day} className="flex flex-col items-center group">
              <div
                className={`w-full h-32 bg-slate-100/90 dark:bg-black/40 rounded-2xl border flex flex-col justify-end p-2 transition-all duration-200 backdrop-blur-sm shadow-inner ${
                  d.isToday
                    ? 'border-amber-500/50 dark:border-leeting-orange/40 ring-1 ring-amber-500/30 dark:ring-leeting-orange/30'
                    : 'border-slate-200 dark:border-white/[0.04] group-hover:border-slate-300 dark:group-hover:border-white/[0.14]'
                }`}
              >
                <div
                  className={`w-full rounded-xl transition-all duration-500 ${
                    d.count > 0
                      ? d.isToday
                        ? 'bg-gradient-to-t from-amber-500 to-leeting-orange shadow-[0_0_14px_rgba(255,161,22,0.5)] group-hover:from-amber-400 group-hover:to-orange-400'
                        : 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] group-hover:from-emerald-500 group-hover:to-teal-300'
                      : 'bg-transparent'
                  }`}
                  style={{
                    height: d.count > 0 ? `${Math.max(14, Math.min(100, d.count * 16))}%` : '4px',
                  }}
                />
              </div>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{d.count}</span>
                {d.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-leeting-orange animate-pulse" />
                )}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  d.isToday ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-500'
                }`}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}