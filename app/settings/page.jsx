'use client';

import { useState } from 'react';
import { 
  SlidersHorizontal, 
  Link2, 
  Moon, 
  Bell, 
  Laptop, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Info,
  Lock
} from 'lucide-react';
import { initialUserData } from '../../lib/mock-data';

export default function SettingsPage() {
  const [quietHours, setQuietHours] = useState(initialUserData.quietHours);
  const [notifications, setNotifications] = useState(initialUserData.notificationPreferences);
  const [devices] = useState(initialUserData.registeredDevices);
  const { connectedAccounts } = initialUserData;

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-leeting-orange text-xs font-bold uppercase tracking-wider mb-1.5">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Configuration Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Settings & Device Registry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Orchestrate authentication states, quiet hour schedules, notification pipelines, and multi-device pairings.
        </p>
      </div>

      {/* Connected Accounts Card (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <div className="p-2 rounded-xl bg-amber-500/10 text-leeting-orange border border-amber-500/20">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Connected Accounts</h3>
            <span className="text-xs text-slate-500">Authentication & data boundaries</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LeetCode Account */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] transition-colors flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  LeetCode Session
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(0,184,163,0.2)]">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </div>
              <div className="text-xl font-extrabold text-white mb-1 tracking-tight">{connectedAccounts.leetcode.username}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Observed securely from your browser cookie jar. Credentials and cookies are never stored, transmitted, or uploaded to any cloud backend.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.06] text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Knowledge Local Sync
              </span>
              <a
                href="https://leetcode.com/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-xs transition-colors"
              >
                Profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Leeting Cloud Account */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] transition-colors flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Leeting Cloud Sync
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Phase 2 Roadmap
                </span>
              </div>
              <div className="text-lg font-bold text-white mb-1 tracking-tight">Supabase PostgreSQL + Auth</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optional cloud synchronization for multi-device history, remote rules, and cross-browser backups.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-slate-500">PostgreSQL RLS</span>
              <button
                disabled
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.06] cursor-not-allowed"
              >
                Available in Phase 2
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours Card (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Quiet Hours Scheduler</h3>
              <p className="text-xs text-slate-400">Silence desktop and extension audio notifications during sleep windows.</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={quietHours.enabled}
            onClick={() => setQuietHours({ ...quietHours, enabled: !quietHours.enabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              quietHours.enabled ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md shadow-purple-500/20' : 'bg-white/[0.1]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
                quietHours.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Start Quiet Time
            </label>
            <input
              type="time"
              value={quietHours.start}
              onChange={(e) => setQuietHours({ ...quietHours, start: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> End Quiet Time
            </label>
            <input
              type="time"
              value={quietHours.end}
              onChange={(e) => setQuietHours({ ...quietHours, end: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences Card (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Notification Channels</h3>
            <span className="text-xs text-slate-500">Fine-grained desktop nudges</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] transition-colors">
            <div>
              <div className="text-sm font-bold text-white">Daily Challenge Morning Prompt</div>
              <div className="text-xs text-slate-400 mt-0.5">Receive an 8:00 AM notification with today&apos;s daily problem.</div>
            </div>
            <button
              onClick={() => toggleNotification('dailyChallengeMorning')}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
                notifications.dailyChallengeMorning ? 'bg-gradient-to-r from-amber-500 to-[#ffa116]' : 'bg-white/[0.1]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ${
                notifications.dailyChallengeMorning ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] transition-colors">
            <div>
              <div className="text-sm font-bold text-white">45-Minute Contest Alert</div>
              <div className="text-xs text-slate-400 mt-0.5">Audible warning 45 minutes before Biweekly and Weekly contests.</div>
            </div>
            <button
              onClick={() => toggleNotification('contestAlert45Min')}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
                notifications.contestAlert45Min ? 'bg-gradient-to-r from-amber-500 to-[#ffa116]' : 'bg-white/[0.1]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ${
                notifications.contestAlert45Min ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] transition-colors">
            <div>
              <div className="text-sm font-bold text-white">Streak Freeze Risk Warning</div>
              <div className="text-xs text-slate-400 mt-0.5">Critical 10:00 PM nudge if today&apos;s streak is still unfulfilled.</div>
            </div>
            <button
              onClick={() => toggleNotification('streakFreezeWarning')}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
                notifications.streakFreezeWarning ? 'bg-gradient-to-r from-amber-500 to-[#ffa116]' : 'bg-white/[0.1]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ${
                notifications.streakFreezeWarning ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Registered Devices (Device Registry Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Registered Extension Agents</h3>
              <span className="text-xs text-slate-500">Multi-browser paired instances</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
            {devices.length} Devices Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                device.isCurrent
                  ? 'bg-white/[0.04] border-amber-500/35 shadow-[0_0_20px_-5px_rgba(255,161,22,0.2)] ring-1 ring-amber-500/25 backdrop-blur-md'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-white">{device.name}</span>
                </div>
                {device.isCurrent ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                    Active Session
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">{device.lastSeen}</span>
                )}
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <div>Browser: <span className="text-slate-300 font-medium">{device.browser}</span></div>
                <div>OS: <span className="text-slate-300">{device.os}</span> • Build: <span className="text-slate-300 font-mono">{device.version}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Device encryption keys are generated locally in the extension manifest sandbox.</span>
        </div>
      </div>
    </div>
  );
}
