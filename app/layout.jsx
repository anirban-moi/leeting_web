import './globals.css';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export const metadata = {
  title: 'Leeting • Hybrid Obsidian Glassmorphism Hub',
  description: 'Next-generation desktop companion and habit controller for LeetCode engineers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-leeting-orange/20 selection:text-leeting-orange relative">
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
      </body>
    </html>
  );
}
