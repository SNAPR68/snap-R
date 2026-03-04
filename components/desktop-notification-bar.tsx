'use client';

import { NotificationBell } from './notification-bell';

/**
 * Thin top bar for desktop dashboard — renders notification bell in the top-right.
 * Hidden on mobile (mobile header has its own bell).
 */
export function DesktopNotificationBar() {
  return (
    <div className="hidden md:flex items-center justify-end px-6 py-2 border-b border-white/8" style={{ background: 'linear-gradient(90deg, rgba(15,15,15,0) 0%, rgba(212,160,23,0.03) 100%)', backdropFilter: 'blur(12px)' }}>
      <NotificationBell />
    </div>
  );
}
