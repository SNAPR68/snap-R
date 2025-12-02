'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mr-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back to Dashboard</span>
      </Link>
      <Link href="/dashboard" className="flex items-center gap-3">
        <img src="/snapr-logo.png" alt="SnapR" className="w-[76px] h-[76px]" />
        <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
      </Link>
    </nav>
  );
}

export { Navbar };
