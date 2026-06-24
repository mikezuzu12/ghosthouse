"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OrderChat from "@/app/components/OrderChat";
import dynamic from 'next/dynamic';
import DriverLocationTracker from "@/app/components/DriverLocationTracker";
import NotificationBell from "@/app/components/NotificationBell";
import { useAuth } from '@/hook/useAuth'; // ← FIXED: 'hooks' not 'hook'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(
  () => import('@/app/components/LiveMap'),
  { ssr: false, loading: () => <div className="h-[300px] bg-white/5 rounded-xl animate-pulse" /> }
);

type Order = {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  delivery_status: string;
  claimed_at?: string;
  delivered_at?: string;
  created_at: string;
  driver_id?: string;
};

type Stats = {
  available: number;
  claimed: number;
  delivered: number;
  totalEarnings?: number;
};

type Notification = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

type Location = {
  id: string;
  driver_id: number;
  driver_name: string;
  order_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'active' | 'idle' | 'offline';
  updated_at: string;
};

// ── Status Pill Component ──
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    available:  { label: "Available",    color: "text-blue-400 bg-blue-500/10 border-blue-500/30", dot: "bg-blue-400" },
    claimed:    { label: "Claimed",      color: "text-amber-400 bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
    in_transit: { label: "In Transit",   color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", dot: "bg-cyan-400" },
    delivered:  { label: "Delivered",    color: "text-green-400 bg-green-500/10 border-green-500/30", dot: "bg-green-400" },
    cancelled:  { label: "Cancelled",    color: "text-red-400 bg-red-500/10 border-red-500/30", dot: "bg-red-400" },
  };
  const s = map[status?.toLowerCase()] ?? { 
    label: status, 
    color: "text-slate-400 bg-white/5 border-white/10", 
    dot: "bg-slate-400" 
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status !== 'cancelled' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

// ── Loading Skeleton ──
function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-8 w-16 bg-white/5 rounded mb-3" />
              <div className="h-4 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white/5 rounded-2xl p-4 animate-pulse">
          <div className="h-10 w-full bg-white/5 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-white/5 rounded w-3/4 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  // ── AUTH CHECK ──
  const { isLoading, isAuthenticated } = useAuth({ requiredRole: 'driver' });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // ── REST OF YOUR DRIVER DASHBOARD CODE ──
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"available" | "claimed" | "delivered">("available");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    available: 0,
    claimed: 0,
    delivered: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Protect route
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch orders when tab or session changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [tab, status]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === "authenticated") {
        fetchOrders();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [tab, status]);

  // Fetch driver location when tracking is opened
  useEffect(() => {
    if (!showTracking) {
      setDriverLocation(null);
      return;
    }

    setLoadingLocation(true);
    fetch(`/api/driver/location?order_id=${showTracking}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.location) {
          setDriverLocation(data.location);
        }
        setLoadingLocation(false);
      })
      .catch(() => setLoadingLocation(false));

    const interval = setInterval(() => {
      fetch(`/api/driver/location?order_id=${showTracking}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.location) {
            setDriverLocation(data.location);
          }
        })
        .catch(console.error);
    }, 5000);

    return () => clearInterval(interval);
  }, [showTracking]);

  const addNotification = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers/orders?status=${tab}`);
      const data = await res.json();

      if (!res.ok) {
        addNotification("Failed to fetch orders", "error");
        return;
      }

      setOrders(data.orders || []);
      setStats(data.stats || { available: 0, claimed: 0, delivered: 0, totalEarnings: 0 });
    } catch (err) {
      addNotification("Network error fetching orders", "error");
    } finally {
      setLoading(false);
    }
  }

  async function claimOrder(id: string) {
    setClaiming(id);
    try {
      const res = await fetch(`/api/drivers/orders/${id}/claim`, { method: "POST" });
      if (res.ok) {
        await fetchOrders();
        addNotification("Order claimed successfully! 🚚", "success");
      } else {
        const error = await res.json();
        addNotification(error.error || "Failed to claim order", "error");
      }
    } catch (err) {
      addNotification("Failed to claim order", "error");
    } finally {
      setClaiming(null);
    }
  }

  async function completeOrder(id: string) {
    setCompleting(id);
    try {
      const res = await fetch(`/api/drivers/orders/${id}/complete`, { method: "POST" });
      if (res.ok) {
        await fetchOrders();
        addNotification("Order delivered! Great job! ✅", "success");
        if (chatOrderId === id) setChatOrderId(null);
        if (showTracking === id) setShowTracking(null);
      } else {
        const error = await res.json();
        addNotification(error.error || "Failed to mark as delivered", "error");
      }
    } catch (err) {
      addNotification("Failed to complete order", "error");
    } finally {
      setCompleting(null);
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return "📦";
      case "claimed": return "🚚";
      case "delivered": return "✅";
      default: return "📋";
    }
  };

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  const user = session?.user as any;

  return (
    <div className="min-h-screen font-sans" style={{ background: "#0A0E1A", color: "#F0F4FF" }}>

      {/* ── Notifications ── */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            } min-w-[250px] backdrop-blur-xl`}
            style={{ background: "rgba(17, 24, 39, 0.95)" }}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl" style={{ background: "rgba(10,14,26,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
              💧
            </div>
            <span className="font-bold text-white tracking-tight text-sm">AquaPure</span>
            <span className="hidden sm:inline text-xs text-slate-600 font-medium border-l border-white/10 pl-2.5 ml-0.5">
              Driver Portal
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {currentTime.toLocaleTimeString()}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                {user?.name?.[0] ?? "D"}
              </div>
              <span className="hidden sm:inline text-sm text-slate-300 font-medium">
                {user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2"
        >
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(" ")[0] ?? "Driver"}.
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {stats.available} orders available • {stats.claimed} in progress
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </motion.div>

        {/* ── Stats Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Available", value: stats.available, icon: "📦", accent: "#3B82F6" },
            { label: "Claimed", value: stats.claimed, icon: "🚚", accent: "#F59E0B" },
            { label: "Delivered", value: stats.delivered, icon: "✅", accent: "#10B981" },
            { label: "Earnings", value: `R${stats.totalEarnings || 0}`, icon: "💰", accent: "#8B5CF6" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
              className="rounded-xl border border-white/8 p-4" 
              style={{ background: "#111827" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Search and Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/8 p-4" 
          style={{ background: "#111827" }}
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Search by customer name, address, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", color: "#F0F4FF" }}
              />
            </div>

            <div className="flex gap-1 p-1 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
              {(["available", "claimed", "delivered"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize text-sm flex items-center gap-1.5 ${
                    tab === t
                      ? "text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  style={tab === t ? { background: "linear-gradient(135deg,#3B82F6,#06B6D4)" } : {}}
                >
                  <span>{getStatusIcon(t)}</span>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Orders Grid ── */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/8 p-12 text-center" 
            style={{ background: "#111827" }}
          >
            <div className="text-6xl mb-4">{getStatusIcon(tab)}</div>
            <h3 className="text-xl font-bold text-white mb-2">No {tab} orders</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {tab === "available"
                ? "New orders will appear here when customers place them."
                : tab === "claimed"
                ? "Claim available orders to see them here."
                : "Delivered orders will appear here for your records."}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/8 overflow-hidden hover:border-white/15 transition-all group"
                  style={{ background: "#111827" }}
                >
                  {/* Order Header */}
                  <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between"
                    style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.08) 0%, rgba(6,182,212,0.04) 100%)" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">👤</span>
                        <h3 className="font-bold text-white truncate">{order.customer_name || "Customer"}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-lg font-bold text-white">R{order.total.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="px-5 py-4 space-y-3">
                    {/* Address */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">📍</span>
                        <p className="text-xs text-slate-500 font-medium">Delivery Address</p>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{order.delivery_address}</p>
                    </div>

                    {/* Items Preview */}
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">🛒</span>
                        <p className="text-xs text-slate-500 font-medium">
                          Items ({order.items?.length || 0})
                        </p>
                      </div>
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-400">{item.name} × {item.quantity}</span>
                            <span className="text-slate-300">R{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <p className="text-xs text-slate-500 mt-1">+{order.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/8">
                      {/* View Details */}
                      <button
                        onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition px-2 py-1"
                      >
                        View details →
                      </button>

                      {/* Tracking - claimed orders only */}
                      {tab === "claimed" && (
                        <button
                          onClick={() => setShowTracking(showTracking === order.id ? null : order.id)}
                          className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full transition ${
                            showTracking === order.id
                              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                              : "text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          📍 {showTracking === order.id ? "Hide" : "Track"}
                        </button>
                      )}

                      {/* Chat - claimed orders only */}
                      {tab === "claimed" && (
                        <button
                          onClick={() => setChatOrderId(chatOrderId === order.id ? null : order.id)}
                          className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full transition ${
                            chatOrderId === order.id
                              ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                              : "text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          💬 {chatOrderId === order.id ? "Close" : "Chat"}
                        </button>
                      )}
                    </div>

                    {/* Main Action Button */}
                    {tab === "available" && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => claimOrder(order.id)}
                        disabled={claiming === order.id}
                        className="w-full py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-70 text-sm"
                        style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
                      >
                        {claiming === order.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Claiming...
                          </span>
                        ) : (
                          "Claim this order →"
                        )}
                      </motion.button>
                    )}

                    {tab === "claimed" && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => completeOrder(order.id)}
                        disabled={completing === order.id}
                        className="w-full py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-70 text-sm"
                        style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
                      >
                        {completing === order.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Updating...
                          </span>
                        ) : (
                          "✓ Mark as Delivered"
                        )}
                      </motion.button>
                    )}

                    {tab === "delivered" && (
                      <div className="w-full py-2.5 rounded-xl text-center font-semibold flex items-center justify-center gap-2 text-sm"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}
                      >
                        <span>✅</span>
                        <span>Delivered</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Order Details Modal ── */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
              onClick={() => setShowDetails(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/8"
              style={{ background: "#111827" }}
            >
              <div className="px-6 py-5 border-b border-white/8"
                style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.08) 100%)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">Order Details</h3>
                    <p className="text-slate-400 text-sm mt-1">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-white transition p-1">
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Customer Information</h4>
                  <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">Name</span>
                      <span className="text-slate-200 text-sm">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">Phone</span>
                      <span className="text-slate-200 text-sm">{selectedOrder.customer_phone || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">Email</span>
                      <span className="text-slate-200 text-sm">{selectedOrder.customer_email || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Delivery Address</h4>
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-slate-200 text-sm">{selectedOrder.delivery_address}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Order Items</h4>
                  <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.name} × {item.quantity}</span>
                        <span className="text-white font-medium">R{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/8 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-white">R{selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/8">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white transition text-sm"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Tracking Modal ── */}
      <AnimatePresence>
        {showTracking && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
              onClick={() => setShowTracking(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/8"
              style={{ background: "#111827" }}
            >
              <div className="px-6 py-5 border-b border-white/8"
                style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.08) 100%)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">📍 Live Tracking</h3>
                    <p className="text-slate-400 text-sm mt-1">#{showTracking.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <button onClick={() => setShowTracking(null)} className="text-slate-400 hover:text-white transition p-1">
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <DriverLocationTracker orderId={showTracking} />
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-400 mb-2">📍 Location Map</p>
                  <MapComponent 
                    orderId={showTracking}
                    driverLocation={driverLocation ?? undefined}
                    isDriver={true}
                  />
                </div>

                {driverLocation && (
                  <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver Status</span>
                      <span className={`font-semibold ${
                        driverLocation.status === 'active' ? 'text-emerald-400' :
                        driverLocation.status === 'idle' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {driverLocation.status === 'active' ? '🟢 Active' :
                         driverLocation.status === 'idle' ? '🟡 Idle' : '⚪ Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Update</span>
                      <span className="text-slate-300">{new Date(driverLocation.updated_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Accuracy</span>
                      <span className="text-slate-300">{driverLocation.accuracy?.toFixed(0) || 'N/A'} meters</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-white/8">
                <button
                  onClick={() => setShowTracking(null)}
                  className="w-full py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white transition text-sm"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  Close Tracking
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat ── */}
      {chatOrderId && <OrderChat orderId={chatOrderId} />}
    </div>
  );
}