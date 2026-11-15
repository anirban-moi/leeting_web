'use client';

import { useState, useEffect } from 'react';
import { 
  Flame, 
  Download, 
  X, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { useExtensionBridge } from '../../lib/services/extension-bridge';

const DISMISSED_KEY = 'leeting_extension_prompt_dismissed';

export default function ExtensionInstallPrompt() {
  const { isOnline } = useExtensionBridge();
  const [isVisible, setIsVisible] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [browserType, setBrowserType] = useState('chrome');

  useEffect(() => {
    // If the extension is already running and transmitting data, do not show prompt
    if (isOnline) {
      setIsVisible(false);
      return;
    }

    // Check if user already dismissed or installed before
    try {
      const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
      if (isDismissed) return;
    } catch {
      // In case localStorage is disabled or restricted
    }

    // Detect user browser
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('firefox')) {
        setBrowserType('firefox');
      } else if (ua.includes('edg')) {
        setBrowserType('edge');
      } else if (ua.includes('brave')) {
        setBrowserType('brave');
      } else {
        setBrowserType('chrome');
      }
    }

    // Gentle 2-second delay so first-time visitors can orient themselves first
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOnline]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save dismiss state to localStorage', e);
    }
  };

  const handleDownload = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {}
  };

  if (!isVisible || isOnline) return null;

  const downloadFile = browserType === 'firefox'
    ? '/downloads/leeting-extension-firefox.zip'
    : '/downloads/leeting-extension-chrome.zip';

  const downloadLabel = browserType === 'firefox'
    ? 'Download for Firefox'
    : browserType === 'edge'
    ? 'Download for Edge'
    : 'Download for Chrome / Brave';

  return (
    <div className="fixed bottom-5 right-5 z-[9990] max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] animate-slideUp">
      <div className="glass-obsidian rounded-3xl p-5 sm:p-6 border border-amber-500/30 shadow-[0_20px_50px_-10px_rgba(255,161,22,0.22)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-2xl">
        {/* Ambient backglow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
          aria-label="Dismiss extension install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Flame Badge */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-leeting-orange to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/25 shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                Minimal Setup • Instant Flow
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Try the Extension at Ease
            </h4>
          </div>
        </div>

        {/* Friendly explanation copy */}
        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Track your daily LeetCode streaks with zero hassle. The companion extension syncs your live consistency matrix, monitors daily solving cadence, and shields your study sessions with distraction locks.
        </p>

        {/* Quick Highlights Strip */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Automatic Streak Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>100% Zero-Knowledge</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2.5">
          <a
            href={downloadFile}
            download
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{downloadLabel}</span>
          </a>

          <button
            onClick={handleDismiss}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors shrink-0"
          >
            Maybe Later
          </button>
        </div>

        {/* Collapsible 3-Step Setup Guide */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>How to install in 30 seconds</span>
            </span>
            {isGuideOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isGuideOpen && (
            <div className="mt-2.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-black/30 p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.04]">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>Download and unzip the extension package.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>Open <code className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">{browserType === 'firefox' ? 'about:debugging' : 'chrome://extensions'}</code> and enable <strong>Developer mode</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>Click <strong>{browserType === 'firefox' ? '"Load Temporary Add-on"' : '"Load unpacked"'}</strong> and select the unzipped folder. You&apos;re all set!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
