'use client';

import { useState } from 'react';
import { Clock, ShieldCheck, Lock, CheckCircle2, Zap } from 'lucide-react';
import FocusTimer from '../../components/focus/FocusTimer';
import RuleToggle from '../../components/focus/RuleToggle';
import { initialUserData } from '../../lib/mock-data';

export default function FocusPage() {
  const [rules, setRules] = useState(initialUserData.focusRules);
  const [solveBeforeScroll, setSolveBeforeScroll] = useState(initialUserData.focusPreferences.solveBeforeScroll);
  const [syncToast, setSyncToast] = useState(false);

  const handleToggleRule = (id) => {
    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id === id) {
          return { ...rule, enabled: !rule.enabled };
        }
        return rule;
      })
    );
    showSyncFeedback();
  };

  const handleToggleSolveBeforeScroll = () => {
    setSolveBeforeScroll(!solveBeforeScroll);
    showSyncFeedback();
  };

  const showSyncFeedback = () => {
    setSyncToast(true);
    setTimeout(() => {
      setSyncToast(false);
    }, 2200);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Toast Feedback */}
      {syncToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0c1018]/95 backdrop-blur-2xl border border-leeting-orange/40 text-white shadow-2xl shadow-orange-500/15 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">Remote rules dispatched to browser extension!</span>
        </div>
      )}

      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-leeting-orange text-xs font-bold uppercase tracking-wider mb-1.5">
          <Clock className="w-4 h-4" />
          <span>Productivity & Automation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Focus & Distraction Shield
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Execute Pomodoro focus cycles and remotely orchestrate Declarative Net Request blocking rules across your browsers.
        </p>
      </div>

      {/* Main Dual Grid: Timer (Left) + Rule Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Pomodoro Ring (5 cols) */}
        <div className="lg:col-span-5">
          <FocusTimer />
        </div>

        {/* Right Column: Distraction Rules & Solve Before Scroll (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Solve Before Scroll Banner (Glassmorphic) */}
          <div className="glass-obsidian p-6 sm:p-8 rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-leeting-orange border border-amber-500/25 shadow-[0_0_15px_rgba(255,161,22,0.2)] shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Solve Before Scroll</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      solveBeforeScroll
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(255,161,22,0.2)]'
                        : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                    }`}>
                      {solveBeforeScroll ? 'Enforced' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Automatically redirects algorithmic video and social feeds to LeetCode until today&apos;s daily challenge (<span className="text-amber-400 font-semibold">Two Sum</span>) is marked as solved.
                  </p>
                </div>
              </div>

              {/* Master Enforcer Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={solveBeforeScroll}
                onClick={handleToggleSolveBeforeScroll}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                  solveBeforeScroll ? 'bg-gradient-to-r from-amber-500 to-[#ffa116] shadow-md shadow-orange-500/25' : 'bg-white/[0.1]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
                    solveBeforeScroll ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Distraction Rules Section (Glassmorphic) */}
          <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Remote Distraction Blocklist</h3>
                  <span className="text-xs text-slate-500">Live Declarative Net Request rules</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                {rules.filter((r) => r.enabled).length} of {rules.length} active
              </span>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleToggle key={rule.id} rule={rule} onToggle={handleToggleRule} />
              ))}
            </div>

            <div className="pt-3 flex items-center gap-2 text-xs text-slate-500">
              <Zap className="w-3.5 h-3.5 text-leeting-orange shrink-0" />
              <span>Rules are enforced locally by the MV3 service worker without proxying network traffic.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
