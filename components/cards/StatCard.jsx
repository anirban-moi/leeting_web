'use client';

import { useAnimatedProgress } from '../../lib/hooks/useCountUp';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  accent = 'orange', 
  trend,
  progress,
  className = '' 
}) {
  const animatedProgress = useAnimatedProgress(typeof progress === 'number' ? progress : 0);
  const accentStyles = {
    orange: {
      icon: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(255,161,22,0.25)]',
      progress: 'bg-gradient-to-r from-amber-500 to-[#ffa116]',
    },
    green: {
      icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(0,184,163,0.25)]',
      progress: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    },
    yellow: {
      icon: 'text-amber-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_-3px_rgba(255,184,0,0.25)]',
      progress: 'bg-gradient-to-r from-yellow-500 to-amber-400',
    },
    cyan: {
      icon: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.25)]',
      progress: 'bg-gradient-to-r from-cyan-500 to-blue-400',
    },
  };

  const style = accentStyles[accent] || accentStyles.orange;

  return (
    <div className={`glass-obsidian-card group relative p-6 rounded-3xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-2xl border transition-transform duration-300 group-hover:scale-105 ${style.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main KPI Display */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
          {value}
        </span>
        {trend && (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
            {trend}
          </span>
        )}
      </div>

      {/* Optional Progress Meter */}
      {typeof progress === 'number' && (
        <div className="mt-3.5 w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.05] overflow-hidden p-0.5">
          <div 
            className={`h-full rounded-full ${style.progress}`}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      )}

      {/* Subtitle / Context */}
      {subtitle && (
        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
}
