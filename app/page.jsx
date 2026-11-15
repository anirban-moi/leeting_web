'use client';

import { useState, useEffect } from 'react';
import { 
  Flame, 
  Coins, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Crown, 
  ExternalLink,
  Lock,
  LogIn,
  User
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '../components/cards/StatCard';
import ChallengeCard from '../components/cards/ChallengeCard';
import ContestCard from '../components/cards/ContestCard';
import { initialUserData } from '../lib/mock-data';
import { useAuth } from '../components/auth/AuthProvider';
import { fetchUserProfile } from '../lib/services/profile-service';
import { useExtensionBridge } from '../lib/services/extension-bridge';
import { useCountUp, useAnimatedProgress } from '../lib/hooks/useCountUp';
import { hasUserLoggedInOnce, getCachedUserData, saveUserCache } from '../lib/services/user-cache';

export default function HomePage() {
  const { user, isCloudConnected } = useAuth();
  const [cachedUser, setCachedUser] = useState(null);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  const [profile, setProfile] = useState(initialUserData.profile);
  const [publicData, setPublicData] = useState({ daily: null, contests: [] });
  const { 
    isOnline, 
    remoteUser, 
    remoteDaily, 
    remoteContests, 
    isSyncing, 
    lastSyncedAt, 
    triggerSync, 
    browserName 
  } = useExtensionBridge(user?.id);

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

  const effectiveUser = remoteUser || cachedUser;
  const activeUsername = effectiveUser?.username || profile.username || 'The-Boss';
  const activeStreak = effectiveUser?.currentStreak ?? effectiveUser?.streak ?? profile.streak;
  const activeCoins = effectiveUser?.points ?? effectiveUser?.coins ?? profile.leetCoins;
  const totalSolved = effectiveUser?.totalSolved 
    ?? (effectiveUser?.difficultyStats 
      ? ((Number(effectiveUser.difficultyStats.easy) || 0) + (Number(effectiveUser.difficultyStats.medium) || 0) + (Number(effectiveUser.difficultyStats.hard) || 0))
      : profile.totalSolved);

  // Dynamic animated metrics starting from 0
  const animatedStreak = useCountUp(activeStreak, { duration: 1200 });
  const animatedCoins = useCountUp(activeCoins, { duration: 1200 });
  const animatedTotalSolved = useCountUp(totalSolved, { duration: 1200 });

  const rawAcceptanceRate = parseFloat(profile.acceptanceRate) || 68.4;
  const animatedAcceptanceRate = useCountUp(rawAcceptanceRate, { duration: 1200, decimals: 1 });

  const streakPct = Math.min(100, Math.round((activeStreak / 30) * 100));
  const animatedStreakPct = useCountUp(streakPct, { 
    duration: 1350, 
    decimals: 0, 
    oscillate: streakPct < 50 
  });
  const animatedStreakBar = useAnimatedProgress(streakPct, { duration: 1350 });

  const totalSolvedPct = Math.min(100, Math.round((totalSolved / (profile.totalAvailable || 3370)) * 100 * 10) / 10);

  // Fallback to Next.js API route if extension is on standby
  useEffect(() => {
    fetch('/api/leetcode')
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setPublicData({ daily: d.daily, contests: d.contests || [] });
        }
      })
      .catch(() => {});
  }, []);

  const effectiveDaily = remoteDaily || publicData.daily;
  const liveDaily = effectiveDaily ? {
    title: effectiveDaily.title,
    frontendId: effectiveDaily.frontendId,
    difficulty: effectiveDaily.difficulty,
    topicTags: effectiveDaily.topicTags,
    isSolved: effectiveDaily.isSolved,
    link: effectiveDaily.link,
    date: effectiveDaily.date ? `Today • ${effectiveDaily.date}` : 'Today',
    acceptance: effectiveDaily.acceptance || '53.2%',
  } : initialUserData.dailyChallenge;

  const liveContests = (remoteContests && remoteContests.length > 0)
    ? remoteContests
    : (publicData.contests.length > 0 ? publicData.contests : [initialUserData.nextContest]);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id).then((p) => {
        if (p) setProfile(p);
      });
    }
  }, [user]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Flagship Hero Section & KPI Grid (Image 1 Section) */}
      {isClientReady && !isUserAvailable ? (
        <>
          {/* Guest Standby Hero Section */}
          <div className="glass-obsidian relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-9 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]">
            {/* Ambient radial glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Greeting, Standby Info, Actions */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Guest Session • LeetCode Standby</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-slate-500 dark:text-slate-400 font-normal">v1.0.9</span>
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Welcome to <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 dark:from-white dark:via-slate-100 dark:to-amber-200 bg-clip-text text-transparent">Leeting</span>
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    Sign in to link your LeetCode account, track your daily solving streak, and manage distraction shields for your browser.
                  </p>
                </div>

                {/* Guest Sign In Call To Action */}
                <div className="mt-5 flex items-center gap-3">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Sync Profile</span>
                  </Link>
                </div>

                {/* Milestone Progress Bar (Standby) */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md max-w-xl shadow-sm dark:shadow-inner">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                      <Flame className="w-3.5 h-3.5 text-slate-400" />
                      30-Day Streak Target
                    </span>
                    <span className="text-slate-500 font-mono font-medium">-- / 30 Days (0%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden p-0.5">
                    <div className="h-full rounded-full bg-slate-300 dark:bg-white/10" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              {/* Right Column: Guest Profile Showcase Badge */}
              <div className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end w-full">
                <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] backdrop-blur-xl relative overflow-hidden shadow-lg dark:shadow-2xl flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-2xl p-1 bg-slate-200 dark:bg-white/[0.06] border border-slate-300/60 dark:border-white/[0.08] flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
                      <User className="w-12 h-12" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Guest User
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Account Not Connected</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.04]">
                      <span className="text-slate-400 text-xs font-bold block">--</span>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Streak</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.04]">
                      <span className="text-slate-400 text-xs font-bold block">--</span>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Coins</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.04]">
                      <span className="text-slate-400 text-xs font-bold block">--</span>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Solved</span>
                    </div>
                  </div>

                  <Link
                    href="/sign-in"
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 transition hover:scale-105"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Connect</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Primary KPI Grid (3 Columns) - Standby Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              title="Active Streak"
              value="-- Days"
              subtitle="Sign in to track active streak"
              icon={Flame}
              accent="orange"
              trend="Standby"
              progress={0}
            />
            <StatCard
              title="LeetCoins Balance"
              value="--"
              subtitle="Sign in to track coins"
              icon={Coins}
              accent="yellow"
              trend="Standby"
              progress={0}
            />
            <StatCard
              title="Total Solved"
              value="-- / 3370"
              subtitle="Sign in to track solved questions"
              icon={CheckCircle2}
              accent="green"
              trend="Standby"
              progress={0}
            />
          </div>
        </>
      ) : (
        <>
          {/* Active User Top Flagship Hero Section */}
          <div className="glass-obsidian relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-9 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]">
            {/* Ambient radial glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Greeting, Streak Target, Actions */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 dark:border-amber-500/30 text-xs font-bold shadow-[0_0_15px_rgba(255,161,22,0.15)] dark:shadow-[0_0_15px_rgba(255,161,22,0.25)]">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{isOnline ? `${browserName} MV3 Live • ${activeUsername}` : 'LeetCode Session Standby'}</span>
                    <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400" />
                    <span className="text-slate-500 dark:text-slate-400 font-normal">v1.0.9</span>
                  </div>

                  <button
                    onClick={() => triggerSync()}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm dark:shadow-none"
                    title="Sync live GraphQL data from LeetCode via Extension"
                  >
                    <RefreshCw className={`w-3 h-3 text-amber-500 dark:text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : (lastSyncedAt ? 'Synced' : 'Sync Live')}</span>
                  </button>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Welcome back, <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 dark:from-white dark:via-slate-100 dark:to-amber-200 bg-clip-text text-transparent">{activeUsername}</span>
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    Your <strong className="text-amber-600 dark:text-amber-400 font-semibold">{activeStreak}-day streak</strong> is currently active. Solve today&apos;s challenge to maintain your streak and unlock your restricted social feeds.
                  </p>
                </div>

                {/* Not logged into LeetCode prompt */}
                {remoteUser && !remoteUser.isSignedIn && (
                  <div className="mt-4">
                    <a
                      href="https://leetcode.com/accounts/login/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                      <span>Not logged into LeetCode on {browserName} • Click here to Sign In ↗</span>
                    </a>
                  </div>
                )}

                {/* Milestone Progress Bar */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md max-w-xl shadow-sm dark:shadow-inner">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                      <Flame className="w-3.5 h-3.5 text-leeting-orange fill-leeting-orange" />
                      30-Day Streak Target
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                      {animatedStreak} / 30 Days ({animatedStreakPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-leeting-orange to-amber-400 shadow-[0_0_12px_rgba(255,161,22,0.4)]"
                      style={{ width: `${animatedStreakBar}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Profile Showcase Badge */}
              <div className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end w-full">
                <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] backdrop-blur-xl relative overflow-hidden shadow-lg dark:shadow-2xl flex flex-col items-center text-center group hover:border-amber-500/30 transition-all duration-300">
                  {/* Subtle ambient backglow */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Avatar with Ring & Crown Badge */}
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-br from-amber-400 via-leeting-orange to-amber-600 shadow-xl shadow-orange-500/20">
                      {remoteUser?.avatar || profile.avatarUrl ? (
                        <img
                          src={remoteUser?.avatar || profile.avatarUrl}
                          alt={activeUsername}
                          className="w-full h-full rounded-xl object-cover bg-slate-900"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-2xl font-black text-amber-400">
                          {activeUsername.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 p-1.5 rounded-xl shadow-md border border-amber-200">
                      <Crown className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  {/* Username & Status */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {activeUsername}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      <span>LeetCode Verified</span>
                      <span>•</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {profile.ranking ? `Rank #${profile.ranking.toLocaleString()}` : 'Active Coder'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stat Strip */}
                  <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.04] shadow-sm dark:shadow-none">
                      <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-leeting-orange text-xs font-bold">
                        <Flame className="w-3 h-3 fill-current" />
                        <span>{animatedStreak}d</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">Streak</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.04] shadow-sm dark:shadow-none">
                      <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-yellow-400 text-xs font-bold">
                        <Coins className="w-3 h-3" />
                        <span>{animatedCoins.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">Coins</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.04] shadow-sm dark:shadow-none">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{animatedTotalSolved}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">Solved</span>
                    </div>
                  </div>

                  {/* Profile Link */}
                  <a
                    href={`https://leetcode.com/u/${activeUsername}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:border-amber-500/30 text-xs font-semibold shadow-sm transition"
                  >
                    <span>View Public Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Primary KPI Grid (3 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              title="Active Streak"
              value={`${animatedStreak} Days`}
              subtitle="Streak freeze protection ready"
              icon={Flame}
              accent="orange"
              trend="+1 today"
              progress={streakPct}
            />
            <StatCard
              title="LeetCoins Balance"
              value={animatedCoins.toLocaleString()}
              subtitle="Daily check-in collected"
              icon={Coins}
              accent="yellow"
              trend="Store Ready"
              progress={75}
            />
            <StatCard
              title="Total Solved"
              value={`${animatedTotalSolved} / ${profile.totalAvailable}`}
              subtitle={`Acceptance rate: ${animatedAcceptanceRate}%`}
              icon={CheckCircle2}
              accent="green"
              trend="Top 4.2%"
              progress={totalSolvedPct}
            />
          </div>
        </>
      )}

      {/* Main Dual Grid: Daily Challenge + Next Contest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChallengeCard challenge={liveDaily} />
        </div>

        <div className="lg:col-span-1">
          <ContestCard contests={liveContests} contest={liveContests[0]} />
        </div>
      </div>

      {/* Focus & Remote Controller Quick Teaser Banner */}
      <div className="glass-obsidian p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-leeting-orange shadow-[0_0_20px_rgba(255,161,22,0.2)] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Focus & Shield Remote Controller</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                5 Rules Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Launch Pomodoro deep-work timers and manage social media distraction locks for your browser.
            </p>
          </div>
        </div>

        <Link
          href="/focus"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-sm dark:shadow-none"
        >
          <span>Launch Focus Center</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        </Link>
      </div>
    </div>
  );
}
