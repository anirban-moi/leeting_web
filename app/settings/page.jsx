'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  SlidersHorizontal, 
  Link2, 
  Moon, 
  Sun,
  Palette,
  Bell, 
  Laptop, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Info,
  Lock,
  Cloud,
  LogOut,
  LogIn,
  Save,
  Check,
  UserCheck
} from 'lucide-react';
import { initialUserData } from '../../lib/mock-data';
import { useAuth } from '../../components/auth/AuthProvider';
import { useTheme } from '../../components/theme/ThemeProvider';
import { fetchUserPreferences, saveUserPreferences } from '../../lib/services/preferences-service';
import { fetchUserProfile, updateUserProfile } from '../../lib/services/profile-service';
import { fetchRegisteredDevices } from '../../lib/services/device-service';
import { useExtensionBridge } from '../../lib/services/extension-bridge';

export default function SettingsPage() {
  const { user, isCloudConnected, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isOnline, browserName, version: extVersion } = useExtensionBridge(user?.id);
  const [leetcodeUsername, setLeetcodeUsername] = useState(initialUserData.profile.username);
  const [quietHours, setQuietHours] = useState(initialUserData.quietHours);
  const [notifications, setNotifications] = useState(initialUserData.notificationPreferences);
  const [devices, setDevices] = useState(initialUserData.registeredDevices);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const { connectedAccounts } = initialUserData;

  // Load preferences & profile from Supabase if logged in
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id).then((p) => {
        if (p?.username) setLeetcodeUsername(p.username);
      });
      fetchUserPreferences(user.id).then((prefs) => {
        if (prefs.quietHours) setQuietHours(prefs.quietHours);
        if (prefs.notifications) setNotifications(prefs.notifications);
      });
      fetchRegisteredDevices(user.id).then((devs) => {
        if (devs && devs.length > 0) setDevices(devs);
      });
    }
  }, [user]);

  const handleManualSaveAll = async () => {
    setIsSaving(true);
    let success = true;

    if (user?.id) {
      // 1. Save preferences
      const prefSuccess = await saveUserPreferences(user.id, {
        quietHours,
        notifications,
      });
      // 2. Save profile username
      const profileSuccess = await updateUserProfile(user.id, {
        leetcode_username: leetcodeUsername,
      });
      success = prefSuccess && profileSuccess;
    }

    setIsSaving(false);
    if (success) {
      setSaveStatus('All settings saved to Supabase Cloud!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const toggleNotification = async (key) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(updated);
    if (user?.id) {
      await saveUserPreferences(user.id, { notifications: updated, quietHours });
      setSaveStatus('Notification preference saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleQuietHoursToggle = async () => {
    const updated = { ...quietHours, enabled: !quietHours.enabled };
    setQuietHours(updated);
    if (user?.id) {
      await saveUserPreferences(user.id, { quietHours: updated, notifications });
      setSaveStatus('Quiet hours updated');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Deduplicate: If an active agent is online, exclude the local duplicate from historical devices list
  const otherDevices = devices.filter((device) => {
    if (!isOnline) return true;
    const nameMatch = device.name?.toLowerCase().includes(browserName.toLowerCase());
    const browserMatch = device.browser?.toLowerCase().includes(browserName.toLowerCase());
    return !nameMatch && !browserMatch && !device.isCurrent;
  });

  const totalOnlineCount = isOnline ? 1 + otherDevices.length : 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Toast Feedback */}
      {saveStatus && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0c1018]/95 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Page Title & Global Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-leeting-orange text-xs font-bold uppercase tracking-wider mb-1.5">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Configuration Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings & Device Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Orchestrate authentication states, quiet hour schedules, notification pipelines, and multi-device pairings.
          </p>
        </div>

        {/* Manual Save All Settings Button */}
        <button
          onClick={handleManualSaveAll}
          disabled={isSaving}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Saving to Cloud...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Connected Accounts Card (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-leeting-orange border border-amber-500/20">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Connected Accounts</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Authentication & data boundaries</span>
            </div>
          </div>

          {isCloudConnected && (
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/25 transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LeetCode Account (Local Only) */}
          <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/[0.16] transition-colors flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  LeetCode Account
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(0,184,163,0.15)]">
                  <CheckCircle2 className="w-3 h-3" /> Cookie Synced
                </span>
              </div>

              {/* Editable LeetCode Username */}
              <div className="mb-2">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">LeetCode Username</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleManualSaveAll}
                    title="Save Username"
                    className="p-2 rounded-xl bg-slate-200 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.1] text-amber-500 dark:text-amber-400 border border-slate-300 dark:border-white/[0.08]"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                Observed securely from your browser cookie jar. Your session cookies never leave your local machine.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/[0.06] text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Zero-Knowledge Local Storage
              </span>
              <a
                href={`https://leetcode.com/u/${leetcodeUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-bold flex items-center gap-1 text-xs transition-colors"
              >
                Profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Leeting Cloud Account (Supabase) */}
          <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/[0.16] transition-colors flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  Leeting Cloud Sync
                </span>
                {isCloudConnected ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(0,184,163,0.15)]">
                    Active Session
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Not Connected
                  </span>
                )}
              </div>

              <div className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight truncate">
                {isCloudConnected ? (user?.email || user?.username) : 'Cloud Account & Storage'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isCloudConnected
                  ? 'Your focus history, problem progress, quiet hours, and multi-device rules sync automatically across your devices.'
                  : 'Cloud account for cross-device history, problem progress, remote rules, and automatic backups.'}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                {isCloudConnected ? 'Cloud Synced' : 'Local Mode'}
              </span>
              {isCloudConnected ? (
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log Out (Sign Out)</span>
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-[#ffa116] text-slate-950 shadow-md shadow-orange-500/20 hover:scale-105 transition-all"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance & Theme (3-Option Selector) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-leeting-orange border border-amber-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Appearance & Theme</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Choose your aesthetic: Obsidian Glass, Crisp Light, or System Auto-Sync
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 capitalize">
            {theme} {theme === 'system' ? `(${resolvedTheme})` : 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 relative group flex flex-col justify-between ${
              theme === 'light'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_24px_-4px_rgba(255,161,22,0.25)] ring-2 ring-amber-500/30'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/[0.14] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  <Sun className="w-5 h-5" />
                </div>
                {theme === 'light' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Crisp Light Mode</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Clean, high-contrast light surface with warm amber accents, ideal for daytime coding sessions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Light Palette</span>
              <span className={theme === 'light' ? 'text-amber-500 font-bold' : ''}>#f8fafc</span>
            </div>
          </button>

          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 relative group flex flex-col justify-between ${
              theme === 'dark'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_24px_-4px_rgba(255,161,22,0.25)] ring-2 ring-amber-500/30'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/[0.14] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  <Moon className="w-5 h-5" />
                </div>
                {theme === 'dark' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Obsidian Dark Mode</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Signature Concept 4 dark glass with void blacks, floating glass cards, and neon amber highlights.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Obsidian Void</span>
              <span className={theme === 'dark' ? 'text-amber-500 font-bold' : ''}>#08090d</span>
            </div>
          </button>

          {/* System Theme Option */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 relative group flex flex-col justify-between ${
              theme === 'system'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_24px_-4px_rgba(255,161,22,0.25)] ring-2 ring-amber-500/30'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/[0.14] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Laptop className="w-5 h-5" />
                </div>
                {theme === 'system' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">System Dynamic</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Synchronizes automatically with your OS preference via matchMedia, seamlessly adapting at dusk and dawn.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>OS Preference</span>
              <span className={theme === 'system' ? 'text-amber-500 font-bold' : ''}>auto ({resolvedTheme})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Quiet Hours Card (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Quiet Hours Scheduler</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Silence desktop and extension audio notifications during sleep windows.</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={quietHours.enabled}
            onClick={handleQuietHoursToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              quietHours.enabled ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md shadow-purple-500/20' : 'bg-slate-200 dark:bg-white/[0.1]'
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
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-black/5 dark:border-white/[0.06] backdrop-blur-md">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Start Quiet Time
            </label>
            <input
              type="time"
              value={quietHours.start}
              onChange={(e) => setQuietHours({ ...quietHours, start: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-black/5 dark:border-white/[0.06] backdrop-blur-md">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> End Quiet Time
            </label>
            <input
              type="time"
              value={quietHours.end}
              onChange={(e) => setQuietHours({ ...quietHours, end: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleManualSaveAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/[0.08] text-xs font-semibold transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Save Quiet Hours to Cloud</span>
        </button>
      </div>

      {/* Notification Preferences Card (Glassmorphic) */}
      <div className="glass-obsidian p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border border-yellow-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Notification Channels</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Fine-grained desktop nudges</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.025] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] border border-black/5 dark:border-white/[0.06] transition-colors">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Daily Challenge Morning Prompt</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive an 8:00 AM notification with today&apos;s daily problem.</div>
            </div>
            <button
              onClick={() => toggleNotification('dailyChallengeMorning')}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
                notifications.dailyChallengeMorning ? 'bg-gradient-to-r from-amber-500 to-[#ffa116]' : 'bg-slate-200 dark:bg-white/[0.1]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ${
                notifications.dailyChallengeMorning ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.025] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] border border-black/5 dark:border-white/[0.06] transition-colors">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">45-Minute Contest Alert</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Audible warning 45 minutes before Biweekly and Weekly contests.</div>
            </div>
            <button
              onClick={() => toggleNotification('contestAlert45Min')}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
                notifications.contestAlert45Min ? 'bg-gradient-to-r from-amber-500 to-[#ffa116]' : 'bg-slate-200 dark:bg-white/[0.1]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ${
                notifications.contestAlert45Min ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.025] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] border border-black/5 dark:border-white/[0.06] transition-colors">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Streak Freeze Risk Warning</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Critical 10:00 PM nudge if today&apos;s streak is still unfulfilled.</div>
            </div>
            <button
              onClick={() => toggleNotification('streakFreezeWarning')}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
                notifications.streakFreezeWarning ? 'bg-gradient-to-r from-amber-500 to-[#ffa116]' : 'bg-slate-200 dark:bg-white/[0.1]'
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
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Registered Extension Agents</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Multi-browser paired instances</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/[0.08]">
            {totalOnlineCount} {totalOnlineCount === 1 ? 'Device' : 'Devices'} Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isOnline && (
            <div className="p-5 rounded-2xl border bg-amber-500/[0.04] dark:bg-white/[0.04] border-amber-500/35 shadow-[0_0_20px_-5px_rgba(255,161,22,0.15)] ring-1 ring-amber-500/25 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{browserName} Active Agent</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live MV3 Bridge
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div>Platform: <span className="text-slate-700 dark:text-slate-300 font-medium">{browserName} Desktop</span></div>
                <div>Extension Build: <span className="text-slate-700 dark:text-slate-300 font-mono">v{extVersion}</span> • Channel: <span className="text-emerald-600 dark:text-emerald-400 font-mono">Direct Window Bridge</span></div>
              </div>
            </div>
          )}

          {otherDevices.map((device) => (
            <div
              key={device.id}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                device.isCurrent
                  ? 'bg-amber-500/[0.04] dark:bg-white/[0.04] border-amber-500/35 shadow-[0_0_20px_-5px_rgba(255,161,22,0.15)] ring-1 ring-amber-500/25 backdrop-blur-md'
                  : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/[0.14] backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.name}</span>
                </div>
                {device.isCurrent ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                    Active Session
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{device.lastSeen}</span>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div>Browser: <span className="text-slate-700 dark:text-slate-300 font-medium">{device.browser}</span></div>
                <div>OS: <span className="text-slate-700 dark:text-slate-300">{device.os}</span> • Build: <span className="text-slate-700 dark:text-slate-300 font-mono">{device.version}</span></div>
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
