"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    `nav-link px-4 py-2 rounded-lg transition-all ${
      pathname === path
        ? "nav-link-active text-[var(--accent-gold)] font-semibold"
        : "text-[var(--text-main)]"
    }`;

  return (
    <header className="w-full bg-[var(--surface)] border-b border-[var(--surface-soft)] shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 md:px-6 h-auto md:h-16 flex flex-col md:flex-row items-center justify-between py-3 md:py-0 gap-3 md:gap-0">
        {/* BRAND */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="/snapr-logo.png" 
            width={200} 
            height={60} 
            alt="SnapR Logo" 
            className="object-contain h-10 w-auto"
          />
        </Link>

        {/* LINKS */}
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm flex-wrap justify-center">
          <Link href="/dashboard" className={linkClasses("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/upload" className={linkClasses("/upload")}>
            Upload
          </Link>
          <Link href="/listings" className={linkClasses("/listings")}>
            Listings
          </Link>
          <Link href="/jobs" className={linkClasses("/jobs")}>
            Jobs
          </Link>
          <Link href="/billing" className={linkClasses("/billing")}>
            Billing
          </Link>
          <Link href="/settings" className={linkClasses("/settings")}>
            Settings
          </Link>
        </div>
      </nav>
    </header>
  );
}
