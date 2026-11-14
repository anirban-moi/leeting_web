'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Zap,
  History,
  Cloud,
  RefreshCw,
  Flame,
  Award,
  Timer,
  Laptop,
} from 'lucide-react';
import FocusTimer from '../../components/focus/FocusTimer';
import RuleToggle from '../../components/focus/RuleToggle';
import { initialUserData } from '../../lib/mock-data';
import { useAuth } from '../../components/auth/AuthProvider';
import { useExtensionBridge } from '../../lib/services/extension-bridge';
import { saveUserPreferences, fetchUserPreferences } from '../../lib/services/preferences-service';
import { fetchFocusHistory } from '../../lib/services/focus-service';

export default function FocusPage() {
  const { user } = useAuth();
  const {
    isOnline,
    browserName,
    latency,
    remoteDaily,
    focusModeEnabled,
    solveBeforeScrollEnabled,
    remoteTimer,
    setRemoteFocus,
    setRemoteSolveBeforeScroll,
    startRemoteTimer,
    stopRemoteTimer,
    checkStatus,
  } = useExtensionBridge(user?.id);

  const [rules, setRules] = useState(initialUserData.focusRules);
  const [solveBeforeScroll, setSolveBeforeScroll] = useState(
    initialUserData.focusPreferences.solveBeforeScroll
  );
  const [masterFocus, setMasterFocus] = useState(false);
  const [syncToast, setSyncToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Remote rules dispatched to browser extension!');
  const [toastType, setToastType] = useState('success');

  // Cloud Focus Session History State
  const [focusHistory, setFocusHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Load preferences from Supabase
  useEffect(() => {
    if (user?.id) {
      fetchUserPreferences(user.id).then((prefs) => {
        if (prefs) {
          if (prefs.focusRules) setRules(prefs.focusRules);
          if (typeof prefs.solveBeforeScroll === 'boolean') {
            setSolveBeforeScroll(prefs.solveBeforeScroll);
          }
        }
      });
    }
  }, [user]);

  // Load focus sessions history from Supabase / Local storage
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const history = await fetchFocusHistory(user?.id);
      setFocusHistory(history || []);
    } catch (err) {
      console.warn('Failed to fetch focus history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Keep Solve Before Scroll in sync with extension bridge
  useEffect(() => {
    if (typeof solveBeforeScrollEnabled === 'boolean') {
      setSolveBeforeScroll(solveBeforeScrollEnabled);
    }
  }, [solveBeforeScrollEnabled]);

  // Keep Focus Mode Shield in sync with extension bridge
  useEffect(() => {
    if (typeof focusModeEnabled === 'boolean') {
      setMasterFocus(focusModeEnabled);
    }
  }, [focusModeEnabled]);

  const handleToggleMasterFocus = async () => {
    const nextVal = !masterFocus;
    setMasterFocus(nextVal);
    const res = await setRemoteFocus(nextVal);

    if (user?.id) {
      await saveUserPreferences(user.id, { focusRules: rules, solveBeforeScroll });
    }

    if (res?.success) {
      showSyncFeedback(
        `Focus Mode Shield ${nextVal ? 'Activated' : 'Disabled'} in ${browserName} extension!`,
        'success'
      );
    } else {
      showSyncFeedback(`Extension offline or not reloaded. Saved to cloud.`, 'warning');
    }
  };

  const handleToggleRule = async (id) => {
    const updated = rules.map((rule) => {
      if (rule.id === id) {
        return { ...rule, enabled: !rule.enabled };
      }
      return rule;
    });
    setRules(updated);

    const hasActiveRule = updated.some((r) => r.enabled);
    setMasterFocus(hasActiveRule);
    const res = await setRemoteFocus(hasActiveRule);

    if (user?.id) {
      await saveUserPreferences(user.id, { focusRules: updated, solveBeforeScroll });
    }

    if (res?.success) {
      showSyncFeedback(`Rule updated in ${browserName} extension and synced with cloud!`, 'success');
    } else {
      showSyncFeedback(`Extension offline or not reloaded. Saved to cloud.`, 'warning');
    }
  };

  const handleToggleSolveBeforeScroll = async () => {
    const nextVal = !solveBeforeScroll;
    setSolveBeforeScroll(nextVal);
    const res = await setRemoteSolveBeforeScroll(nextVal);

    if (user?.id) {
      await saveUserPreferences(user.id, { solveBeforeScroll: nextVal, focusRules: rules });
    }

    if (res?.success) {
      showSyncFeedback(
        `Solve Before Scroll ${nextVal ? 'Enforced' : 'Disabled'} in ${browserName} extension!`,
        'success'
      );
    } else {
      showSyncFeedback(`Extension offline or not reloaded. Saved to cloud.`, 'warning');
    }
  };

  const handleSessionCompleted = () => {
    loadHistory();
    showSyncFeedback('Pomodoro cycle recorded and synced to Supabase Cloud! +25 Coins', 'success');
  };

  const showSyncFeedback = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setSyncToast(true);
    setTimeout(() => {
      setSyncToast(false);
    }, 2800);
  };

  // Compute aggregated stats
  const totalFocusMinutes = focusHistory.reduce(
    (acc, s) => acc + (s.duration_minutes || s.durationMinutes || 0),
    0
  );
  const completedCyclesCount = focusHistory.filter((s) => s.completed !== false).length;

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Toast Feedback */}
      {syncToast && (
        <div
          className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl backdrop-blur-2xl border shadow-2xl animate-bounce ${
            toastType === 'success'
              ? 'bg-[#0c1018]/95 border-emerald-500/40 text-white shadow-emerald-500/15'
              : 'bg-[#18130c]/95 border-amber-500/40 text-white shadow-amber-500/15'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-ping ${
              toastType === 'success' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {toastType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Live Agent Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-leeting-orange text-xs font-bold uppercase tracking-wider mb-1.5">
            <Clock className="w-4 h-4" />
            <span>Productivity & Automation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Focus & Distraction Shield
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Execute Pomodoro focus cycles and remotely orchestrate Declarative Net Request blocking
            rules across your browsers.
          </p>
        </div>

        <button
          onClick={() => checkStatus()}
          title="Click to probe browser companion"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/[0.08] shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-semibold text-slate-200">
            {isOnline
              ? `${browserName} MV3 Agent Connected${latency ? ` (${latency}ms)` : ''}`
              : 'Local Extension Standby (Click to sync)'}
          </span>
        </button>
      </div>

      {/* Main Dual Grid: Timer (Left) + Rule Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Pomodoro Ring (5 cols) */}
        <div className="lg:col-span-5">
          <FocusTimer
            bridge={{
              isOnline,
              remoteTimer,
              startRemoteTimer,
              stopRemoteTimer,
            }}
            onSessionCompleted={handleSessionCompleted}
          />
        </div>

        {/* Right Column: Distraction Rules & Solve Before Scroll (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Solve Before Scroll Banner (Glassmorphic) */}
          <div className="glass-obsidian p-6 sm:p-8 rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl border shrink-0 ${
                    solveBeforeScroll
                      ? 'bg-amber-500/10 text-leeting-orange border-amber-500/25 shadow-[0_0_15px_rgba(255,161,22,0.2)]'
                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                  }`}
                >
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Solve Before Scroll
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        solveBeforeScroll
                          ? remoteDaily?.isSolved
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(255,161,22,0.2)]'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                      }`}
                    >
                      {solveBeforeScroll
                        ? remoteDaily?.isSolved
                          ? 'Solved Today (Unlocked)'
                          : 'Enforced'
                        : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    {remoteDaily?.isSolved ? (
                      <span>
                        Today&apos;s daily challenge (
                        <span className="text-emerald-400 font-semibold">
                          {remoteDaily?.title || 'Daily Challenge'}
                        </span>
                        ) is <span className="text-emerald-400 font-bold">Solved</span>!
                        Distraction shield is unlocked for today.
                      </span>
                    ) : (
                      <span>
                        Automatically redirects algorithmic video and social feeds to LeetCode until
                        today&apos;s daily challenge (
                        <span className="text-amber-400 font-semibold">
                          {remoteDaily?.title || 'Daily Challenge'}
                        </span>
                        ) is marked as solved.
                      </span>
                    )}
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
                  solveBeforeScroll
                    ? 'bg-gradient-to-r from-amber-500 to-[#ffa116] shadow-md shadow-orange-500/25'
                    : 'bg-white/[0.1]'
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
                <div
                  className={`p-2 rounded-xl border transition-all ${
                    masterFocus
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(0,184,163,0.2)]'
                      : 'bg-white/[0.02] text-slate-500 border-white/[0.06]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Focus Mode Shield
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                        masterFocus
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(0,184,163,0.2)]'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                      }`}
                    >
                      {masterFocus ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Live Declarative Net Request rules across all browsers
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                  {rules.filter((r) => r.enabled).length} of {rules.length} active
                </span>

                {/* Master Focus Mode Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={masterFocus}
                  onClick={handleToggleMasterFocus}
                  title="Toggle Focus Mode in Browser Extension"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                    masterFocus
                      ? 'bg-gradient-to-r from-emerald-500 to-[#00b8a3] shadow-md shadow-emerald-500/25'
                      : 'bg-white/[0.1]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
                      masterFocus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleToggle key={rule.id} rule={rule} onToggle={handleToggleRule} />
              ))}
            </div>

            <div className="pt-3 flex items-center gap-2 text-xs text-slate-500">
              <Zap className="w-3.5 h-3.5 text-leeting-orange shrink-0" />
              <span>
                Rules are enforced locally by the MV3 service worker without proxying network traffic.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Target 4: Cloud Focus Session History & Analytics Card */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.06] gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-leeting-orange border border-amber-500/20 shadow-inner">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Cloud Focus Session History
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Uplink
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Synchronized Pomodoro sessions, device audit logs, and focus coin telemetry
              </span>
            </div>
          </div>

          <button
            onClick={loadHistory}
            disabled={isHistoryLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-bold border border-white/[0.08] transition shadow-sm self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
            <span>{isHistoryLoading ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>

        {/* 4 Summary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-xs text-slate-400 block font-semibold">Total Focused Time</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {totalFocusMinutes}{' '}
              <span className="text-slate-500 text-xs font-normal">mins</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-xs text-slate-400 block font-semibold">Completed Cycles</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {completedCyclesCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-xs text-slate-400 block font-semibold">Focus Coins Earned</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 flex items-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400" />+
              {focusHistory.reduce(
                (acc, s) =>
                  acc +
                  ((s.duration_minutes || s.durationMinutes || 25) >= 60
                    ? 50
                    : (s.duration_minutes || s.durationMinutes || 25) >= 45
                    ? 35
                    : 25),
                0
              )}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-xs text-slate-400 block font-semibold">Active Shield Device</span>
            <span className="text-sm font-bold text-slate-200 mt-2 flex items-center gap-1.5 truncate">
              <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
              {browserName} Companion
            </span>
          </div>
        </div>

        {/* Focus Sessions Table / Feed */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="pb-3 pl-1">Timestamp</th>
                <th className="pb-3">Focus Cycle</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Device Agent</th>
                <th className="pb-3 pr-1 text-right">Cloud Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {focusHistory.map((session, idx) => {
                const dateStr = session.started_at || session.startedAt || new Date().toISOString();
                const dur = session.duration_minutes || session.durationMinutes || 25;
                const formattedDate = new Date(dateStr).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={session.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pl-1 font-mono text-slate-300">{formattedDate}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-leeting-orange" />
                        <span className="font-semibold text-white">
                          {dur === 25
                            ? 'Pomodoro Cycle'
                            : dur === 45
                            ? 'Deep Work Session'
                            : dur === 60
                            ? 'Flow State Session'
                            : 'Marathon Session'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-slate-300 font-bold">{dur} mins</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {session.device || `${browserName} MV3 Agent`}
                    </td>
                    <td className="py-3.5 pr-1 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                        <Cloud className="w-3 h-3 text-emerald-400" />
                        Synced
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}