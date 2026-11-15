import { dark } from '@clerk/themes';

/**
 * Returns Clerk appearance configuration dynamically tailored for Light or Dark mode.
 * In Light mode: Uses clean white/slate obsidian glass, dark crisp typography, and high-contrast inputs.
 * In Dark mode: Uses dark obsidian glass, deep zinc/black background, and subtle frosted borders.
 *
 * @param {boolean} isDark
 * @returns {object}
 */
export function getClerkAppearance(isDark = true) {
  return {
    baseTheme: isDark ? dark : undefined,
    variables: {
      colorPrimary: '#ffa116',
      colorPrimaryForeground: '#090a0f',
      colorBackground: isDark ? '#0c1018' : '#ffffff',
      colorForeground: isDark ? '#f8fafc' : '#0f172a',
      colorNeutral: isDark ? '#f1f5f9' : '#1e293b',
      colorInput: isDark ? '#131823' : '#f8fafc',
      colorInputForeground: isDark ? '#ffffff' : '#0f172a',
      colorTextSecondary: isDark ? '#cbd5e1' : '#64748b',
      borderRadius: '0.85rem',
    },
    elements: {
      card: isDark
        ? 'bg-[#0c1018]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl text-slate-100'
        : 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl text-slate-900',
      headerTitle: isDark
        ? 'text-white text-xl font-black tracking-tight'
        : 'text-slate-900 text-xl font-black tracking-tight',
      headerSubtitle: isDark
        ? 'text-slate-300 text-xs mt-1 font-normal'
        : 'text-slate-600 text-xs mt-1 font-normal',
      socialButtonsBlockButton: isDark
        ? 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.14] text-white transition-colors'
        : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors',
      socialButtonsBlockButtonText: isDark
        ? 'text-slate-100 font-semibold text-xs'
        : 'text-slate-800 font-semibold text-xs',
      dividerLine: isDark ? 'bg-white/[0.14]' : 'bg-slate-200',
      dividerText: isDark
        ? 'text-slate-300 text-xs uppercase font-semibold'
        : 'text-slate-500 text-xs uppercase font-semibold',
      formFieldLabel: isDark
        ? 'text-slate-200 text-xs font-semibold tracking-wide mb-1'
        : 'text-slate-700 text-xs font-semibold tracking-wide mb-1',
      formFieldInput: isDark
        ? 'bg-[#131823] border border-white/[0.18] text-white text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500 rounded-xl px-4 py-2.5'
        : 'bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400 rounded-xl px-4 py-2.5',
      formButtonPrimary:
        'bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 transition-all py-3 rounded-xl',
      footerActionText: isDark ? 'text-slate-300 text-xs' : 'text-slate-600 text-xs',
      footerActionLink: isDark
        ? 'text-amber-400 hover:text-amber-300 font-bold text-xs underline decoration-amber-400/40'
        : 'text-amber-600 hover:text-amber-500 font-bold text-xs underline decoration-amber-600/40',
      identityPreviewText: isDark ? 'text-white font-medium' : 'text-slate-900 font-medium',
      identityPreviewEditButton: isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-500',
      userButtonPopoverCard: isDark
        ? 'bg-[#0c1018]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl text-slate-100'
        : 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl text-slate-900',
      userButtonPopoverActionButton: isDark
        ? 'hover:bg-white/[0.08] text-slate-200 hover:text-white'
        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-950',
      userButtonPopoverActionButtonText: isDark
        ? 'text-xs text-slate-200 font-medium'
        : 'text-xs text-slate-700 font-medium',
    },
  };
}
