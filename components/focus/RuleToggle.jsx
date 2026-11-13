'use client';

import { Shield, ShieldAlert, Globe } from 'lucide-react';

export default function RuleToggle({ rule, onToggle }) {
  const domainColors = {
    'youtube.com': 'group-hover:border-rose-500/30 text-rose-400',
    'instagram.com': 'group-hover:border-fuchsia-500/30 text-fuchsia-400',
    'facebook.com': 'group-hover:border-blue-500/30 text-blue-400',
    'linkedin.com': 'group-hover:border-cyan-500/30 text-cyan-400',
  };

  const domainColor = domainColors[rule.domain] || 'text-slate-400';

  return (
    <div className="group p-4 sm:p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.15] backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 transition-all ${
          rule.enabled 
            ? 'bg-amber-500/10 text-leeting-orange border border-amber-500/30 shadow-[0_0_12px_rgba(255,161,22,0.2)]' 
            : 'bg-white/[0.02] text-slate-500 border border-white/[0.06]'
        }`}>
          {rule.enabled ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
              {rule.name}
            </h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.08]">
              <Globe className="w-2.5 h-2.5 text-slate-500" />
              {rule.domain}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              • {rule.category}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-1 sm:line-clamp-none">
            {rule.description}
          </p>
        </div>
      </div>

      {/* Switch Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={rule.enabled}
        onClick={() => onToggle(rule.id)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
          rule.enabled 
            ? 'bg-gradient-to-r from-amber-500 to-[#ffa116] shadow-md shadow-orange-500/25' 
            : 'bg-white/[0.1]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
            rule.enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
