'use client';

import { useState, useEffect } from 'react';
import { Trophy, Timer, ArrowUpRight, Bell, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContestCard({ contest, contests = [] }) {
  const contestList = contests.length > 0 ? contests : (contest ? [contest] : []);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeContest = contestList[currentIndex] || contest || {
    title: 'Upcoming Contest',
    durationMinutes: 90,
    startTimeMs: Date.now() + 86400000,
    url: 'https://leetcode.com/contest/',
  };

  const [countdown, setCountdown] = useState(activeContest.countdown || 'Calculating...');

  useEffect(() => {
    function updateCountdown() {
      const targetTime = activeContest.startTimeMs || (activeContest.startTime ? activeContest.startTime * 1000 : null);
      if (!targetTime) {
        setCountdown(activeContest.countdown || 'Soon');
        return;
      }

      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setCountdown('Live Now!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`);
      } else {
        setCountdown(`${hours}h ${mins}m ${secs}s`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeContest]);

  const durationMin = activeContest.durationMinutes || (activeContest.duration ? Math.round(activeContest.duration / 60) : 90);
  const contestUrl = activeContest.url || (activeContest.titleSlug ? `https://leetcode.com/contest/${activeContest.titleSlug}` : 'https://leetcode.com/contest/');

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : contestList.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < contestList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="glass-obsidian-card group relative p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 dark:text-yellow-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Official Contest
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Global Rating Ranked</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
              {durationMin}m Duration
            </span>

            {contestList.length > 1 && (
              <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-lg p-0.5 border border-black/5 dark:border-white/[0.06]">
                <button
                  onClick={handlePrev}
                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition"
                  title="Previous Contest"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1">
                  {currentIndex + 1}/{contestList.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition"
                  title="Next Contest"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-500 dark:group-hover:text-yellow-400 transition-colors">
            {activeContest.title}
          </h3>

          {/* High-tech Frosted Countdown Box */}
          <div className="p-4 rounded-2xl bg-amber-500/[0.04] dark:bg-black/40 border border-amber-500/20 dark:border-white/[0.06] backdrop-blur-md flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Starts In</span>
            </div>
            <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 tracking-wider">
              {countdown}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-1.5 pt-1">
            <Bell className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <span>Desktop reminder will trigger 45 minutes before start.</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" />
          <span>Live rating updates</span>
        </span>

        <a
          href={contestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/[0.18] transition-all shadow-sm"
        >
          <span>Register on LeetCode</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
