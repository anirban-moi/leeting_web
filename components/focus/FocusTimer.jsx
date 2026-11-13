'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Shield } from 'lucide-react';
import { formatTime } from '../../lib/utils';

const DURATIONS = [
  { label: '25m', name: 'Pomodoro', minutes: 25 },
  { label: '45m', name: 'Deep Work', minutes: 45 },
  { label: '60m', name: 'Flow State', minutes: 60 },
  { label: '90m', name: 'Marathon', minutes: 90 },
];

export default function FocusTimer() {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(3);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      setSessionCount((prev) => prev + 1);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const handleSelectDuration = (minutes) => {
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setIsActive(false);
  };

  const handleTogglePlay = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsLeft(selectedMinutes * 60);
  };

  const totalSeconds = selectedMinutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const strokeDashoffset = 552.92 - (552.92 * (100 - progressPercent)) / 100;

  return (
    <div className="glass-obsidian relative p-6 sm:p-8 rounded-3xl flex flex-col items-center">
      {/* Top Header / Mode selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/[0.08] mb-8 max-w-full overflow-x-auto backdrop-blur-md">
        {DURATIONS.map((dur) => (
          <button
            key={dur.label}
            onClick={() => handleSelectDuration(dur.minutes)}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              selectedMinutes === dur.minutes
                ? 'bg-gradient-to-r from-amber-500 to-[#ffa116] text-slate-950 font-bold shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>{dur.label}</span>
            <span className="hidden sm:inline text-[10px] opacity-80 ml-1">({dur.name})</span>
          </button>
        ))}
      </div>

      {/* Luxury Circular SVG Countdown Ring */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
        {/* Ambient glow behind ring when active */}
        {isActive && (
          <div className="absolute inset-6 rounded-full bg-amber-500/15 blur-3xl animate-pulse pointer-events-none" />
        )}

        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffa116" />
              <stop offset="100%" stopColor="#ffb800" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r="88"
            className="text-white/[0.04] stroke-current"
            strokeWidth="7"
            fill="transparent"
          />

          {/* Progress Stroke */}
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke="url(#focusGradient)"
            strokeWidth="7"
            strokeDasharray="552.92"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            fill="transparent"
          />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight drop-shadow-lg">
            {formatTime(secondsLeft)}
          </span>

          <div className="mt-2.5 flex items-center gap-1.5">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(0,184,163,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Focus Active
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Ready to focus
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 mt-2 font-mono">
            Session {sessionCount} of 4 • Target: 100m
          </span>
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-3 sm:gap-4 mt-8">
        <button
          onClick={handleTogglePlay}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-xl ${
            isActive
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 shadow-amber-500/10'
              : 'bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Focus Cycle</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.18] transition-all shadow-sm"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom context notice */}
      <div className="mt-7 flex items-center gap-2 text-xs text-slate-400 text-center">
        <Sparkles className="w-3.5 h-3.5 text-leeting-orange shrink-0" />
        <span>Extension agent enforces DNR block rules while the timer is running.</span>
      </div>
    </div>
  );
}
