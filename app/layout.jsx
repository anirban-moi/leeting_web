import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { AuthProvider } from '../components/auth/AuthProvider';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { ExtensionBridgeProvider } from '../lib/services/extension-bridge';
import ExtensionInstallPrompt from '../components/extension/ExtensionInstallPrompt';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leeting.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Leeting • Habit & Focus Companion for LeetCode Engineers',
    template: '%s • Leeting',
  },
  description:
    'Accelerate your technical interview preparation: 365-day consistency heatmaps, curated company-wise questions, deep-work Pomodoro timer, distraction shield, and cloud synchronization.',
  applicationName: 'Leeting',
  authors: [{ name: 'Leeting Engineering Team', url: siteUrl }],
  generator: 'Next.js',
  keywords: [
    'LeetCode',
    'Technical Interview Preparation',
    'Coding Consistency Matrix',
    'LeetCode Company Questions',
    'Google Interview Questions',
    'Meta Interview Questions',
    'Amazon Interview Questions',
    'Pomodoro Deep Work Timer',
    'Distraction Blocker',
    'Algorithms and Data Structures',
    'LeetCode Extension',
    'Software Engineer Interview Prep',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Leeting',
  publisher: 'Leeting',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Leeting • Habit & Focus Companion for LeetCode Engineers',
    description:
      'Real-time consistency tracking, 3,000+ curated company interview problems, deep-work Pomodoro controller, and multi-device cloud synchronization.',
    url: siteUrl,
    siteName: 'Leeting',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Leeting • Hybrid Obsidian Glassmorphism Hub',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leeting • Habit & Focus Companion for LeetCode Engineers',
    description:
      'Real-time consistency tracking, 3,000+ curated company interview problems, deep-work Pomodoro controller, and multi-device cloud synchronization.',
    images: ['/og-image.png'],
    creator: '@leetingapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08090d' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    'pk_test_bGVldGluZy5jbGVyay5hY2NvdW50cy5kZXYk';

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#ffa116',
          colorPrimaryForeground: '#090a0f',
          colorNeutral: '#f1f5f9',
          borderRadius: '0.85rem',
        },
        elements: {
          card: 'bg-white/95 dark:bg-[#0c1018]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] shadow-2xl text-slate-900 dark:text-slate-100',
          headerTitle: 'text-slate-900 dark:text-white text-xl font-black tracking-tight',
          headerSubtitle: 'text-slate-600 dark:text-slate-300 text-xs mt-1 font-normal',
          socialButtonsBlockButton:
            'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.14] text-slate-800 dark:text-white transition-colors',
          socialButtonsBlockButtonText: 'text-slate-800 dark:text-slate-100 font-semibold text-xs',
          dividerLine: 'bg-slate-200 dark:bg-white/[0.14]',
          dividerText: 'text-slate-500 dark:text-slate-300 text-xs uppercase font-semibold',
          formFieldLabel: 'text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide mb-1',
          formFieldInput:
            'bg-slate-50 dark:bg-[#131823] border border-slate-300 dark:border-white/[0.18] text-slate-900 dark:text-white text-sm focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5',
          formButtonPrimary:
            'bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 transition-all py-3 rounded-xl',
          footerActionText: 'text-slate-600 dark:text-slate-300 text-xs',
          footerActionLink:
            'text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-bold text-xs underline decoration-amber-400/40',
          identityPreviewText: 'text-slate-900 dark:text-white font-medium',
          identityPreviewEditButton: 'text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300',
          userButtonPopoverCard:
            'bg-white/95 dark:bg-[#0c1018]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] shadow-2xl text-slate-900 dark:text-slate-100',
          userButtonPopoverActionButton:
            'hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white',
          userButtonPopoverActionButtonText: 'text-xs text-slate-700 dark:text-slate-200 font-medium',
        },
      }}
    >
      <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'Leeting',
                url: siteUrl,
                applicationCategory: 'DeveloperApplication',
                operatingSystem: 'All',
                description:
                  'Next-generation desktop companion and habit controller for LeetCode engineers.',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
                featureList: [
                  '365-day consistency heatmap tracking',
                  'Top 19 company interview preparation matrix',
                  'Pomodoro deep work timer and distraction shield',
                  'Cross-device cloud synchronization',
                ],
              }),
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('leeting_theme') || 'system';
                    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.classList.remove('light');
                      document.documentElement.style.colorScheme = 'dark';
                    } else {
                      document.documentElement.classList.add('light');
                      document.documentElement.classList.remove('dark');
                      document.documentElement.style.colorScheme = 'light';
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body className="min-h-screen bg-slate-50 dark:bg-[#08090d] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-amber-500/20 selection:text-slate-900 dark:selection:bg-amber-500/30 dark:selection:text-white relative transition-colors duration-300">
          <ThemeProvider>
            <AuthProvider>
              <ExtensionBridgeProvider>
                {/* Ambient atmospheric lighting behind glass panels */}
                <div className="fixed -top-40 -left-40 w-[550px] h-[550px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[150px] pointer-events-none transition-colors duration-300" />
                <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-400/5 dark:bg-purple-600/10 rounded-full blur-[170px] pointer-events-none transition-colors duration-300" />
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

                {/* First-time extension onboarding prompt */}
                <ExtensionInstallPrompt />
              </ExtensionBridgeProvider>
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
