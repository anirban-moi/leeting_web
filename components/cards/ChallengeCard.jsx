'use client';

import { Calendar, CheckCircle2, Tag, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';

export default function ChallengeCard({ challenge }) {
  if (!challenge) return null;

  const isSolved = challenge.isSolved === true || challenge.status === 'Solved';
  const tags = challenge.topicTags || challenge.tags || [];
  const difficulty = challenge.difficulty || 'Medium';
  const title = challenge.title || 'Daily Coding Challenge';
  const url = challenge.link || challenge.url || 'https://leetcode.com/problemset/';
  const frontendId = challenge.frontendId ? `#${challenge.frontendId}` : null;
  const dateText = challenge.date || 'Today';

  const difficultyConfig = {
    Easy: {
      text: 'text-emerald-600 dark:text-[#00b8a3]',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(0,184,163,0.15)] dark:shadow-[0_0_12px_rgba(0,184,163,0.3)]',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
    },
    Medium: {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_12px_rgba(255,184,0,0.15)] dark:shadow-[0_0_12px_rgba(255,184,0,0.3)]',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    Hard: {
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_12px_rgba(255,55,95,0.15)] dark:shadow-[0_0_12px_rgba(255,55,95,0.3)]',
      dot: 'bg-rose-500 dark:bg-rose-400',
    },
  };

  const diff = difficultyConfig[difficulty] || difficultyConfig.Medium;

  return (
    <div className="glass-obsidian-card group relative p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
      {/* Header Bar */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-leeting-orange">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Daily Coding Challenge
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{dateText}</span>
            </div>
          </div>

          <div>
            {isSolved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(0,184,163,0.15)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(255,161,22,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                Pending Today
              </span>
            )}
          </div>
        </div>

        {/* Problem Title & Meta */}
        <div className="mt-5 space-y-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
              {frontendId && <span className="text-slate-400 dark:text-slate-500 font-mono text-xl mr-2">{frontendId}</span>}
              {title}
            </h3>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${diff.bg} ${diff.text} ${diff.border} ${diff.glow}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                {difficulty}
              </span>

              {challenge.acceptance && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-black/[0.03] dark:bg-white/[0.04] px-2.5 py-0.5 rounded-lg border border-black/5 dark:border-white/[0.06]">
                  Acceptance: {challenge.acceptance}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-black/[0.03] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/[0.14] transition-colors"
                >
                  <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-leeting-orange shrink-0" />
          <span>
            {isSolved
              ? 'Challenge solved! Streak secured and distraction shield unlocked.'
              : 'Solving maintains your streak and unlocks distraction shields.'}
          </span>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
            isSolved
              ? 'bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.1] dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 border border-black/10 dark:border-white/[0.1]'
              : 'bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
          }`}
        >
          <span>{isSolved ? 'Review Submission' : 'Solve on LeetCode'}</span>
          {isSolved ? (
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </a>
      </div>
    </div>
  );
}
