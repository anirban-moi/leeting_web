'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Flame, 
  Coins, 
  Menu, 
  X, 
  LayoutGrid, 
  Activity, 
  ShieldCheck, 
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  LogIn,
} from 'lucide-react';
import { SignedIn, SignedOut, UserButton, Show } from '@clerk/nextjs';
import { initialUserData } from '../../lib/mock-data';
import { useAuth } from '../auth/AuthProvider';
import { useExtensionBridge } from '../../lib/services/extension-bridge';

const BREADCRUMB_MAP = {
  '/': { section: 'Platform', title: 'Executive Overview' },
  '/activity': { section: 'Analytics', title: 'Activity & Consistency Hub' },
  '/focus': { section: 'Controls', title: 'Focus & Distraction Shield' },
  '/settings': { section: 'Preferences', title: 'Settings & Device Registry' },
  '/sign-in': { section: 'Authentication', title: 'Clerk Cloud Sign-In' },
  '/sign-up': { section: 'Authentication', title: 'Clerk Cloud Sign-Up' },
  '/login': { section: 'Authentication', title: 'Leeting Cloud Portal' },
};

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/activity', label: 'Activity Hub', icon: Activity },
  { href: '/focus', label: 'Focus & Shield', icon: ShieldCheck },
  { href: '/settings', label: 'Settings & Devices', icon: SlidersHorizontal },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);
  const pathname = usePathname();
  const user = initialUserData.profile;
  const { user: authUser, isCloudConnected, signOut } = useAuth();
  const { isOnline, latency, triggerSync, remoteUser, browserName } = useExtensionBridge(authUser?.id);

  const currentRoute = BREADCRUMB_MAP[pathname] || { section: 'Dashboard', title: 'Overview' };

  const handleManualSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await triggerSync();
    setIsRefreshing(false);
    setSyncFeedback(true);
    setTimeout(() => setSyncFeedback(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="h-14 border-b border-white/[0.08] bg-[#0c1018]/70 backdrop-blur-2xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between select-none shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)]">
        {/* Left: Mobile hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">{currentRoute.section}</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-200 tracking-tight">{currentRoute.title}</span>
          </div>
        </div>

        {/* Right: Metrics, Sync trigger, and Clerk Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Agent Status Pill */}
          {isOnline ? (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold shadow-[0_0_12px_rgba(0,184,163,0.2)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>{browserName} Live • {latency ?? 12}ms</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
              <span>Extension Standby</span>
            </div>
          )}

          {/* Quick Streak Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25 text-[#ffa116] text-xs font-bold shadow-[0_0_12px_rgba(255,161,22,0.15)]">
            <Flame className="w-3.5 h-3.5 fill-leeting-orange text-leeting-orange" />
            <span>{remoteUser?.currentStreak ?? user.streak}d</span>
          </div>

          {/* Quick LeetCoins Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{remoteUser?.points ?? user.leetCoins}</span>
          </div>

          {/* Manual Sync Trigger */}
          <button
            onClick={handleManualSync}
            title="Poll extension agent for fresh activity"
            className="relative p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.14] transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-leeting-orange' : ''}`} />
            {syncFeedback && (
              <span className="absolute -bottom-8 right-0 whitespace-nowrap text-[10px] font-semibold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md shadow-xl animate-fadeIn">
                Synced
              </span>
            )}
          </button>

          {/* Clerk Profile Authentication Section */}
          <div className="flex items-center pl-2 border-l border-white/[0.08]">
            <Show when="signed-in">
              <div className="flex items-center gap-2.5">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        'w-7 h-7 ring-1 ring-amber-500/40 hover:ring-amber-400 transition-all shadow-sm',
                    },
                  }}
                />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-200">
                    {authUser?.username || 'Engineer'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono leading-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Clerk Connected</span>
                  </div>
                </div>
              </div>
            </Show>

            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </Show>
          </div>
        </div>
      </header>

      {/* Mobile Glass Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex animate-fadeIn">
          <div className="w-72 bg-[#0c1018] h-full p-5 flex flex-col justify-between border-r border-white/[0.08] shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-[#ffa116] flex items-center justify-center text-slate-950">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-white">Leeting</span>
                    <span className="text-[10px] text-slate-400 block font-mono">v1.0.9</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-amber-500/15 text-leeting-orange border border-amber-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-leeting-orange" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>{authUser?.email || user.username}</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {isCloudConnected ? 'Clerk Active' : 'Guest'}
                </span>
              </div>
              {isCloudConnected ? (
                <button
                  onClick={handleSignOut}
                  className="w-full mt-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-500/20"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log Out (Sign Out)</span>
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-500/25"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In with Clerk</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
