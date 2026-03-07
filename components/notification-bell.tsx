'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'listing_prepared': return '✅';
    case 'listing_failed': return '⚠️';
    case 'client_viewed': return '👀';
    case 'client_approved': return '✓';
    case 'client_rejected': return '⚠️';
    case 'client_downloaded': return '📥';
    case 'client_commented': return '💬';
    case 'post_published': return '📱';
    case 'post_failed': return '⚠️';
    case 'credits_low': return '⚠️';
    case 'credits_depleted': return '🚨';
    case 'daily_summary': return '📊';
    case 'weekly_report': return '📈';
    default: return '🔔';
  }
}

export function NotificationBell() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=20', { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      console.error('[NotificationBell] Failed to fetch');
    }
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    let userId: string | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel('notifications-bell')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupRealtime();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.link) {
      setIsOpen(false);
      // Use relative path if same origin
      try {
        const url = new URL(notif.link);
        const base = new URL(window.location.origin);
        if (url.origin === base.origin) {
          router.push(url.pathname + url.search);
        } else {
          window.open(notif.link, '_blank');
        }
      } catch {
        router.push(notif.link);
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-[#D4A017] hover:text-amber-300 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-white/30 text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 ${
                    !notif.read ? 'bg-[#D4A017]/5' : ''
                  }`}
                >
                  {/* Icon */}
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug line-clamp-2 ${
                      !notif.read ? 'text-white font-medium' : 'text-white/70'
                    }`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-white/40">{timeAgo(notif.created_at)}</span>
                      {notif.link && <ExternalLink className="w-3 h-3 text-white/20" />}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-2 h-2 rounded-full bg-[#D4A017]" />
                    </div>
                  )}

                  {/* Read indicator */}
                  {notif.read && (
                    <div className="flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100">
                      <Check className="w-3 h-3 text-white/20" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard/notifications');
                }}
                className="text-xs text-[#D4A017] hover:text-amber-300 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
