"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Notification = {
  id: string;
  user_id: number;
  user_role: string;
  order_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
};

export default function NotificationBell() {
  const { data: session, status } = useSession(); // ✅ add session check
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    // ✅ Don't fetch if not authenticated
    if (status !== "authenticated") return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/notifications?limit=20");

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Got HTML instead of JSON — session may not be ready");
        return;
      }

      if (res.status === 401) {
        console.log("Not authenticated yet");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load notifications");
        return;
      }

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);

    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Only fetch when session is confirmed
  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  // ✅ Auto refresh every 30 seconds only when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [status]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });

      if (!res.ok) return;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message": return "💬";
      case "message_sent": return "📤";
      case "order_claimed": return "🚚";
      case "order_delivered": return "✅";
      case "order_created": return "🛒";
      case "test": return "🔔";
      default: return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message": return "text-blue-400 border-blue-500/20 bg-blue-500/10";
      case "message_sent": return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
      case "order_claimed": return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      case "order_delivered": return "text-green-400 border-green-500/20 bg-green-500/10";
      case "test": return "text-purple-400 border-purple-500/20 bg-purple-500/10";
      default: return "text-slate-400 border-white/10 bg-white/5";
    }
  };

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // ✅ Don't render if not logged in
  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-[380px] max-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: "#111827" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[420px]">
              {loading ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">Loading...</p>
                </div>
              ) : error ? (
                <div className="px-5 py-8 text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={fetchNotifications}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Retry
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm text-slate-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${
                      !notification.read ? "bg-blue-500/5" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.order_id) {
                        window.location.href = `/orders/${notification.order_id}`;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? "text-white font-medium" : "text-slate-400"}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {formatTime(notification.created_at)}
                          </span>
                          {notification.order_id && (
                            <Link
                              href={`/orders/${notification.order_id}`}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View order →
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/8 text-center">
              <Link
                href="/notifications"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}