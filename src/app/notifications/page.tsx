"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return; // ✅ wait for session
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    // ✅ only fetch when authenticated
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/notifications?limit=100");

      // ✅ Check content type before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Got HTML instead of JSON");
        return;
      }

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        console.error("API error:", response.status);
        return;
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // ✅ Show loading while session is being checked
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A", color: "#F0F4FF" }}>
      <nav className="sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl" style={{ background: "rgba(10,14,26,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-lg font-bold text-white">Notifications</h1>
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Mark all as read
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-bold text-white mb-2">No notifications</h2>
            <p className="text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 transition cursor-pointer ${
                  notification.read
                    ? "border-white/5 hover:border-white/10"
                    : "border-blue-500/20 bg-blue-500/5"
                }`}
                style={{
                  background: notification.read
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(59,130,246,0.05)",
                }}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.order_id) router.push(`/orders/${notification.order_id}`);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/5">
                    {notification.type === "message" ? "💬" :
                      notification.type === "order_claimed" ? "🚚" :
                      notification.type === "order_delivered" ? "✅" : "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={notification.read ? "text-slate-400" : "text-white font-medium"}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {notification.order_id && (
                        <span className="text-xs text-blue-400">View order →</span>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}