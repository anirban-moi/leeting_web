import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { AuthProvider } from '../components/auth/AuthProvider';

export const metadata = {
  title: 'Leeting • Hybrid Obsidian Glassmorphism Hub',
  description: 'Next-generation desktop companion and habit controller for LeetCode engineers.',
};

export default function RootLayout({ children }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    'pk_test_bGVldGluZy5jbGVyay5hY2NvdW50cy5kZXYk';

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ffa116',
          colorPrimaryForeground: '#090a0f',
          colorBackground: '#0c1018',
          colorForeground: '#f8fafc',
          colorNeutral: '#f1f5f9',
          colorInput: '#131823',
          colorInputForeground: '#ffffff',
          colorTextSecondary: '#cbd5e1',
          borderRadius: '0.85rem',
        },
        elements: {
          card: 'bg-[#0c1018]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl text-slate-100',
          headerTitle: 'text-white text-xl font-black tracking-tight',
          headerSubtitle: 'text-slate-300 text-xs mt-1 font-normal',
          socialButtonsBlockButton:
            'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.14] text-white transition-colors',
          socialButtonsBlockButtonText: 'text-slate-100 font-semibold text-xs',
          dividerLine: 'bg-white/[0.14]',
          dividerText: 'text-slate-300 text-xs uppercase font-semibold',
          formFieldLabel: 'text-slate-200 text-xs font-semibold tracking-wide mb-1',
          formFieldInput:
            'bg-[#131823] border border-white/[0.18] text-white text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500 rounded-xl px-4 py-2.5',
          formButtonPrimary:
            'bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 transition-all py-3 rounded-xl',
          footerActionText: 'text-slate-300 text-xs',
          footerActionLink:
            'text-amber-400 hover:text-amber-300 font-bold text-xs underline decoration-amber-400/40',
          identityPreviewText: 'text-white font-medium',
          identityPreviewEditButton: 'text-amber-400 hover:text-amber-300',
          userButtonPopoverCard:
            'bg-[#0c1018]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl text-slate-100',
          userButtonPopoverActionButton:
            'hover:bg-white/[0.08] text-slate-200 hover:text-white',
          userButtonPopoverActionButtonText: 'text-xs text-slate-200 font-medium',
        },
      }}
    >
      <html lang="en" className="dark scroll-smooth">
        <body className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-leeting-orange/20 selection:text-leeting-orange relative">
          <AuthProvider>
            {/* Ambient atmospheric lighting behind glass panels */}
            <div className="fixed -top-40 -left-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[170px] pointer-events-none" />
            <div className="fixed inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

            {/* Persistent Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
              <Header />
              <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-9 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
