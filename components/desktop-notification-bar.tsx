'use client';

import { NotificationBell } from './notification-bell';

/**
 * Thin top bar for desktop dashboard — renders notification bell in the top-right.
 * Hidden on mobile (mobile header has its own bell).
 */
export function DesktopNotificationBar() {
  return (
    <div className="hidden md:flex items-center justify-end px-6 py-2 border-b border-white/5 bg-[#0F0F0F]">
      <NotificationBell />
    </div>
  );
}
