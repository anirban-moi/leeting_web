'use client';

import { Flame, Coins, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import StatCard from '../components/cards/StatCard';
import ChallengeCard from '../components/cards/ChallengeCard';
import ContestCard from '../components/cards/ContestCard';
import { initialUserData } from '../lib/mock-data';

export default function HomePage() {
  const { profile, dailyChallenge, nextContest } = initialUserData;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Flagship Hero Section (Glassmorphic) */}
      <div className="glass-obsidian relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-9 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold mb-4 shadow-[0_0_15px_rgba(255,161,22,0.25)]">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>LeetCode Live Session Active</span>
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span className="text-slate-400 font-normal">Extension v1.0.9</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Welcome back, <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">{profile.username}</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Your <strong className="text-amber-400 font-semibold">{profile.streak}-day streak</strong> is currently active. Solve today&apos;s challenge to maintain your streak and unlock your restricted social feeds.
          </p>

          {/* Milestone Progress Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md max-w-xl shadow-inner">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-leeting-orange fill-leeting-orange" />
                30-Day Streak Target
              </span>
              <span className="text-amber-400 font-mono">12 / 30 Days (40%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-leeting-orange to-amber-400 shadow-[0_0_12px_rgba(255,161,22,0.5)] transition-all duration-1000"
                style={{ width: '40%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Active Streak"
          value={`${profile.streak} Days`}
          subtitle="Streak freeze protection ready"
          icon={Flame}
          accent="orange"
          trend="+1 today"
          progress={40}
        />
        <StatCard
          title="LeetCoins Balance"
          value={profile.leetCoins.toLocaleString()}
          subtitle="Daily check-in collected"
          icon={Coins}
          accent="yellow"
          trend="Store Ready"
          progress={75}
        />
        <StatCard
          title="Total Solved"
          value={`${profile.totalSolved} / ${profile.totalAvailable}`}
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
          <ChallengeCard challenge={dailyChallenge} />
        </div>

        <div className="lg:col-span-1">
          <ContestCard contest={nextContest} />
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
