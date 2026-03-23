import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status | SnapR',
  description: 'Real-time status of SnapR infrastructure and services.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <nav className="border-b border-white/10 bg-[#0A0A0F] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-xl">
              S
            </div>
            <span className="text-xl font-bold text-white">
              Snap<span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          <h1 className="text-white/60 text-sm font-medium">System Status</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A0A0F] py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/40 text-sm text-center">
            © 2026 SnapR. All rights reserved. | Status updated in real-time.
          </p>
        </div>
      </footer>
    </div>
  );
}
