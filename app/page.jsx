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
  ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '../components/cards/StatCard';
import ChallengeCard from '../components/cards/ChallengeCard';
import ContestCard from '../components/cards/ContestCard';
import { initialUserData } from '../lib/mock-data';
import { useAuth } from '../components/auth/AuthProvider';
import { fetchUserProfile } from '../lib/services/profile-service';
import { useExtensionBridge } from '../lib/services/extension-bridge';

export default function HomePage() {
  const { user } = useAuth();
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

  const activeUsername = remoteUser?.username || profile.username || 'The-Boss';
  const activeStreak = remoteUser?.currentStreak ?? profile.streak;
  const activeCoins = remoteUser?.points ?? profile.leetCoins;
  const totalSolved = remoteUser?.totalSolved ?? profile.totalSolved;

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
      {/* Top Flagship Hero Section (Glassmorphic) */}
      <div className="glass-obsidian relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-9 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Greeting, Streak Target, Actions */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold shadow-[0_0_15px_rgba(255,161,22,0.25)]">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isOnline ? `${browserName} MV3 Live • ${activeUsername}` : 'LeetCode Session Standby'}</span>
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span className="text-slate-400 font-normal">v1.0.9</span>
              </div>

              <button
                onClick={() => triggerSync()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-semibold transition active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Sync live GraphQL data from LeetCode via Extension"
              >
                <RefreshCw className={`w-3 h-3 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : (lastSyncedAt ? 'Synced' : 'Sync Live')}</span>
              </button>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome back, <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">{activeUsername}</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Your <strong className="text-amber-400 font-semibold">{activeStreak}-day streak</strong> is currently active. Solve today&apos;s challenge to maintain your streak and unlock your restricted social feeds.
              </p>
            </div>

            {/* Not logged into LeetCode prompt */}
            {remoteUser && !remoteUser.isSignedIn && (
              <div className="mt-4">
                <a
                  href="https://leetcode.com/accounts/login/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Not logged into LeetCode on {browserName} • Click here to Sign In ↗</span>
                </a>
              </div>
            )}

            {/* Milestone Progress Bar */}
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md max-w-xl shadow-inner">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-leeting-orange fill-leeting-orange" />
                  30-Day Streak Target
                </span>
                <span className="text-amber-400 font-mono">{activeStreak} / 30 Days ({Math.min(100, Math.round((activeStreak / 30) * 100))}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-leeting-orange to-amber-400 shadow-[0_0_12px_rgba(255,161,22,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.round((activeStreak / 30) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Profile Showcase Badge */}
          <div className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-black/40 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col items-center text-center group hover:border-amber-500/30 transition-all duration-300">
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
                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  {activeUsername}
                </h3>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LeetCode Verified</span>
                  <span>•</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    {profile.ranking ? `Rank #${profile.ranking.toLocaleString()}` : 'Active Coder'}
                  </span>
                </div>
              </div>

              {/* Quick Stat Strip */}
              <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-white/[0.06]">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center justify-center gap-1 text-leeting-orange text-xs font-bold">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>{activeStreak}d</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Streak</span>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs font-bold">
                    <Coins className="w-3 h-3" />
                    <span>{activeCoins}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Coins</span>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{totalSolved}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Solved</span>
                </div>
              </div>

              {/* Profile Link */}
              <a
                href={`https://leetcode.com/u/${activeUsername}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] hover:border-amber-500/30 text-xs font-semibold transition"
              >
                <span>View Public Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Active Streak"
          value={`${activeStreak} Days`}
          subtitle="Streak freeze protection ready"
          icon={Flame}
          accent="orange"
          trend="+1 today"
          progress={Math.min(100, Math.round((activeStreak / 30) * 100))}
        />
        <StatCard
          title="LeetCoins Balance"
          value={activeCoins.toLocaleString()}
          subtitle="Daily check-in collected"
          icon={Coins}
          accent="yellow"
          trend="Store Ready"
          progress={75}
        />
        <StatCard
          title="Total Solved"
          value={`${totalSolved} / ${profile.totalAvailable}`}
          subtitle={`Acceptance rate: ${profile.acceptanceRate}`}
          icon={CheckCircle2}
          accent="green"
          trend="Top 4.2%"
          progress={14.3}
        />
      </div>

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
              <h4 className="text-base font-bold text-white tracking-tight">Focus & Shield Remote Controller</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                5 Rules Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Launch Pomodoro deep-work timers and manage social media distraction locks for your browser.
            </p>
          </div>
        </div>

        <Link
          href="/focus"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] hover:border-white/[0.18] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <span>Launch Focus Center</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </Link>
      </div>
    </div>
  );
}
