'use client';

import { Activity, Calendar, Target, TrendingUp, Sparkles, Award, BarChart3 } from 'lucide-react';
import { initialUserData } from '../../lib/mock-data';

export default function ActivityPage() {
  const { difficultyStats, weeklySummary, calendarGrid } = initialUserData;

  // Grid color mapping for 0 to 4 levels
  const levelColors = {
    [-1]: 'bg-white/[0.01] border-dashed border-white/[0.04] text-transparent pointer-events-none',
    0: 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:border-white/[0.14]',
    1: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-400 hover:border-emerald-500/60 shadow-sm',
    2: 'bg-emerald-800/80 border-emerald-600/50 text-emerald-200 hover:border-emerald-400 shadow-sm',
    3: 'bg-emerald-600/90 border-emerald-500 text-white font-bold hover:shadow-[0_0_12px_rgba(0,184,163,0.4)]',
    4: 'bg-emerald-400 border-emerald-300 text-slate-950 font-black shadow-[0_0_14px_rgba(0,184,163,0.5)] hover:scale-110',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-leeting-orange text-xs font-bold uppercase tracking-wider mb-1.5">
            <Activity className="w-4 h-4" />
            <span>Consistency Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Activity & Habit Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily problem cadence, algorithmic difficulty distribution, and focus consistency.
          </p>
        </div>

        {/* Timeframe Chip */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/[0.08] text-xs self-start sm:self-auto backdrop-blur-md">
          <span className="px-3.5 py-1 rounded-xl bg-white/[0.08] text-white font-bold shadow-sm">
            Last 35 Days
          </span>
          <span className="px-3.5 py-1 text-slate-500 cursor-not-allowed">
            YTD
          </span>
        </div>
      </div>

      {/* Top 4 Glass KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Weekly Volume</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono tracking-tight">
            {weeklySummary.problemsSolved}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1.5 font-bold">
            <TrendingUp className="w-3 h-3" /> +4 vs last week
          </span>
        </div>

        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Active Rhythm</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono tracking-tight">
            {weeklySummary.activeDays} <span className="text-slate-500 text-lg font-normal">/ {weeklySummary.totalDays}d</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5 block">Consistency: 71.4%</span>
        </div>

        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Peak Day</span>
            <div className="p-1.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 font-mono tracking-tight">
            {weeklySummary.mostActiveDay}
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5 block">6 problems completed</span>
        </div>

        <div className="glass-obsidian-card p-5 rounded-3xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Weekly Target</span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-leeting-green mt-2 font-mono tracking-tight">
            {weeklySummary.goalCompletion}%
          </div>
          <span className="text-[11px] text-emerald-400 mt-1.5 block font-bold">On track for weekly goal</span>
        </div>
      </div>

      {/* Main Grid: Heatmap + Difficulty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 35-Day Consistency Heatmap (2 cols) */}
        <div className="glass-obsidian lg:col-span-2 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] mb-6 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-leeting-orange border border-amber-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">35-Day Consistency Matrix</h3>
                  <span className="text-xs text-slate-500">October 15 – November 18, 2026</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-[11px]">Less</span>
                <span className="w-3 h-3 rounded-md bg-white/[0.02] border border-white/[0.06]" />
                <span className="w-3 h-3 rounded-md bg-emerald-950/80 border border-emerald-800/40" />
                <span className="w-3 h-3 rounded-md bg-emerald-800/80 border border-emerald-600/50" />
                <span className="w-3 h-3 rounded-md bg-emerald-600/90 border border-emerald-500" />
                <span className="w-3 h-3 rounded-md bg-emerald-400 border border-emerald-300" />
                <span className="text-[11px]">More</span>
              </div>
            </div>

            {/* Matrix Calendar Grid */}
            <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {day}
                </div>
              ))}

              {calendarGrid.map((item, idx) => (
                <div
                  key={idx}
                  className={`h-11 sm:h-12 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative group ${
                    levelColors[item.level] || levelColors[0]
                  } ${item.isToday ? 'ring-2 ring-leeting-orange ring-offset-2 ring-offset-[#08090d]' : ''}`}
                >
                  <span className="text-xs font-mono">{item.day}</span>
                  {item.isToday && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-leeting-orange shadow-[0_0_8px_#ffa116]" />
                  )}

                  {/* Interactive Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex z-30 px-3.5 py-2 rounded-2xl bg-[#0c1018]/95 backdrop-blur-md text-[11px] text-white border border-white/[0.12] whitespace-nowrap shadow-2xl pointer-events-none flex-col items-center animate-fadeIn">
                    <span className="font-bold text-slate-200">{item.date}</span>
                    <span className="text-emerald-400 font-mono">
                      {item.level > 0 ? `${item.level} problem(s) solved` : 'No activity logged'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
            <span>Cadence: 2.1 problems/day</span>
            <span className="text-emerald-400 font-bold">Top 5% consistency tier</span>
          </div>
        </div>

        {/* Difficulty Breakdown (1 col) */}
        <div className="glass-obsidian p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06] mb-6">
              <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Difficulty Progression</h3>
                <span className="text-xs text-slate-500">Algorithmic tier balance</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Easy */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-[#00b8a3] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00b8a3]" />
                    Easy
                  </span>
                  <span className="text-slate-300 font-mono">
                    {difficultyStats.easy.solved} <span className="text-slate-500">/ {difficultyStats.easy.total}</span>
                    <span className="text-xs text-[#00b8a3] ml-1.5 font-bold">({difficultyStats.easy.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,184,163,0.35)]"
                    style={{ width: `${difficultyStats.easy.percentage}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Medium
                  </span>
                  <span className="text-slate-300 font-mono">
                    {difficultyStats.medium.solved} <span className="text-slate-500">/ {difficultyStats.medium.total}</span>
                    <span className="text-xs text-amber-400 ml-1.5 font-bold">({difficultyStats.medium.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,184,0,0.35)]"
                    style={{ width: `${difficultyStats.medium.percentage}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Hard
                  </span>
                  <span className="text-slate-300 font-mono">
                    {difficultyStats.hard.solved} <span className="text-slate-500">/ {difficultyStats.hard.total}</span>
                    <span className="text-xs text-rose-400 ml-1.5 font-bold">({difficultyStats.hard.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,55,95,0.35)]"
                    style={{ width: `${difficultyStats.hard.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md text-xs text-slate-400 mt-6 leading-relaxed shadow-inner">
            <span className="text-slate-200 font-bold block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-leeting-orange" />
              AI Recommendation
            </span>
            Solve 2 additional Medium Dynamic Programming problems to optimize your interview distribution ratio.
          </div>
        </div>
      </div>

      {/* Weekly Daily Volume Bars (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Daily Solving Rhythm (This Week)</h3>
            <span className="text-xs text-slate-500">Problems completed per calendar day</span>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
            18 Total Solved
          </span>
        </div>

        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {weeklySummary.days.map((d) => (
            <div key={d.day} className="flex flex-col items-center group">
              <div className="w-full h-28 bg-black/40 rounded-2xl border border-white/[0.04] flex flex-col justify-end p-2 transition-colors group-hover:border-white/[0.14] backdrop-blur-sm shadow-inner">
                <div
                  className={`w-full rounded-xl transition-all duration-500 ${
                    d.count > 0 
                      ? 'bg-gradient-to-t from-amber-500 to-leeting-orange shadow-[0_0_12px_rgba(255,161,22,0.35)] group-hover:from-amber-400 group-hover:to-orange-400' 
                      : 'bg-transparent'
                  }`}
                  style={{ height: `${Math.max(8, Math.min(100, d.count * 18))}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white mt-2.5 font-mono">{d.count}</span>
              <span className="text-[11px] text-slate-500 font-semibold">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
