'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Flame, 
  LayoutGrid, 
  Activity, 
  Building2,
  ShieldCheck, 
  SlidersHorizontal, 
  ExternalLink,
  Search,
  Sparkles,
  Command
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useExtensionBridge } from '../../lib/services/extension-bridge';
import { hasUserLoggedInOnce, getCachedUserData } from '../../lib/services/user-cache';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isCloudConnected } = useAuth();
  const { isOnline, remoteUser } = useExtensionBridge();

  const [cachedUser, setCachedUser] = useState(null);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
    setHasLoggedIn(hasUserLoggedInOnce());
    setCachedUser(getCachedUserData());
  }, []);

  const isUserAvailable = Boolean(isCloudConnected || hasLoggedIn || remoteUser?.isSignedIn);
  const effectiveUser = remoteUser || cachedUser;
  const leetcodeId = isUserAvailable ? (remoteUser?.username || cachedUser?.username || user?.username || null) : null;
  const activeStreak = effectiveUser?.currentStreak ?? effectiveUser?.streak ?? null;

  const navGroups = useMemo(() => [
    {
      title: 'CORE PLATFORM',
      items: [
        { href: '/', label: 'Overview', icon: LayoutGrid, shortcut: '1' },
        { 
          href: '/activity', 
          label: 'Activity Hub', 
          icon: Activity, 
          shortcut: '2', 
          badge: isUserAvailable && activeStreak ? `Streak: ${activeStreak}` : undefined 
        },
        { href: '/companies', label: 'Company Prep', icon: Building2, shortcut: '3', badge: '19 Top Co' },
      ],
    },
    {
      title: 'AUTOMATION & CONTROLS',
      items: [
        { 
          href: '/focus', 
          label: 'Focus & Shield', 
          icon: ShieldCheck, 
          shortcut: '4',
          badge: 'Shield Armed',
          badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
        },
      ],
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { href: '/settings', label: 'Settings & Devices', icon: SlidersHorizontal, shortcut: '5' },
      ],
    },
  ], [isUserAvailable, activeStreak]);

  return (
    <aside className="w-64 bg-white/85 dark:bg-[#0a0d14]/75 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex select-none z-30 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_24px_-2px_rgba(0,0,0,0.5)] transition-colors duration-300">
      <div>
        {/* Workspace Brand Header */}
        <div className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-leeting-orange to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 group-hover:shadow-orange-500/40 transition-all duration-300">
                <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
              </div>
              {isOnline && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#0a0d14] animate-pulse" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  Leeting
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1] font-mono">
                  v1.0.9
                </span>
              </div>
              {/* Only show workspace ID when user is logged in with their LeetCode account */}
              {isClientReady && isUserAvailable && leetcodeId ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <span>{leetcodeId}&apos;s Workspace</span>
                </p>
              ) : null}
            </div>
          </Link>

          {/* Quick Command Trigger Mockup */}
          <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/[0.14] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer shadow-inner">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-[11px]">Command Palette</span>
            </div>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.06] text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] shadow-sm">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Categorized Navigation */}
        <div className="px-3 py-3.5 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                {group.title}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent text-slate-900 dark:text-white font-semibold border-l-2 border-leeting-orange shadow-[inset_0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-leeting-orange' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          item.badgeColor || 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 hidden group-hover:inline-block">
                        {item.shortcut}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Identity & Agent Uplink status */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.06] space-y-2.5 bg-slate-50/50 dark:bg-black/20">
        <div className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Agent Uplink
            </span>
            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
              18ms
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Syncing with browser extension via local alarm
          </p>
        </div>

        <a
          href="https://leetcode.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors group"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-leeting-orange" />
            LeetCode Web
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
        </a>
      </div>
    </aside>
  );
}
