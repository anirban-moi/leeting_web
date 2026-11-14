'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to Clerk sign-in
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-obsidian w-full max-w-md p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-[#ffa116] flex items-center justify-center mx-auto mb-4 text-slate-950 shadow-lg shadow-orange-500/25">
          <Flame className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Redirecting to Clerk Sign In...</h1>
        <p className="text-xs text-slate-400 mb-6">
          Leeting Cloud has upgraded to Clerk authentication for secure, seamless sign-in.
        </p>

        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#ffa116] text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20"
        >
          <span>Continue to Sign In</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <div className="mt-8 pt-4 border-t border-white/[0.06] text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>LeetCode cookies and passwords stay local to your browser extension.</span>
        </div>
      </div>
    </div>
  );
}
