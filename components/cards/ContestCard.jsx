'use client';

import { Trophy, Timer, ArrowUpRight, Bell, Sparkles } from 'lucide-react';

export default function ContestCard({ contest }) {
  return (
    <div className="glass-obsidian-card group relative p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Contest
              </span>
              <span className="text-[10px] text-slate-500">Global Rating Ranked</span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            {contest.durationMinutes}m Duration
          </span>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-yellow-400 transition-colors">
            {contest.title}
          </h3>

          {/* High-tech Frosted Countdown Box */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">Starts In</span>
            </div>
            <span className="font-mono text-sm font-bold text-amber-400 tracking-wider">
              {contest.countdown}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5 pt-1">
            <Bell className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>Desktop reminder will trigger 45 minutes before start.</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Live rating updates</span>
        </span>

        <a
          href={contest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.18] transition-all shadow-sm group-hover:border-yellow-500/30"
        >
          <span>Register on LeetCode</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
