'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="h-16 bg-surface-container-high border-b border-white/10 flex items-center px-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mr-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back to Dashboard</span>
      </Link>
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-bold text-black text-xl">S</div>
        <span className="text-xl font-bold text-primary">SnapR</span>
      </Link>
    </nav>
  );
}

export { Navbar };
