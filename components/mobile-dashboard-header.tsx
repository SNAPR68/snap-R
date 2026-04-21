'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from './mobile-sidebar-provider';
import { NotificationBell } from './notification-bell';

export function MobileDashboardHeader() {
  const { toggle } = useSidebar();

  return (
    <div className="md:hidden flex items-center justify-between h-14 px-4 bg-surface-container-high border-b border-white/10 flex-shrink-0">
      <div className="flex items-center">
        <button
          onClick={toggle}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" className="ml-3 flex items-center gap-2">
          <span className="text-xl font-bold">
            Snap<span className="text-primary">R</span>
          </span>
        </Link>
      </div>
      <NotificationBell />
    </div>
  );
}
