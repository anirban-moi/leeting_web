'use client';

import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Flame, ShieldCheck, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center p-4 relative">
      {/* Ambient glass glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="mb-6 text-center relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors mb-4 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-[#ffa116] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/25 text-slate-950">
          <Flame className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">Create Leeting Account</h1>
        <p className="text-xs text-slate-300 mt-1.5 font-medium">Multi-device consistency and distraction shield uplink</p>
      </div>

      <div className="relative z-10">
        <Suspense fallback={
          <div className="flex items-center gap-2 text-xs text-slate-300 p-8">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading registration portal...</span>
          </div>
        }>
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
          />
        </Suspense>
      </div>

      <div className="mt-8 max-w-sm text-center relative z-10">
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-xs text-slate-300 flex items-center justify-center gap-2.5 shadow-sm font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero-Knowledge: LeetCode session cookies stay strictly local to your browser extension.</span>
        </div>
      </div>
    </div>
  );
}
