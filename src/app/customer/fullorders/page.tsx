"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  delivery_status: string;
  special_instructions?: string;
  delivery_date?: string;
  delivery_time?: string;
  created_at: string;
};

// ── Status Pill Component (matches dashboard) ──
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    unclaimed:  { label: "Pending",      color: "text-amber-400 bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
    claimed:    { label: "On the Way",   color: "text-blue-400 bg-blue-500/10 border-blue-500/30", dot: "bg-blue-400" },
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
function OrdersSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
          <div>
            <div className="h-8 w-32 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl border border-white/8 p-6 animate-pulse">
              <div className="h-6 bg-white/5 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-20 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/orders/my-orders");

      if (res.status === 401) {
        setError("Please log in to view your orders.");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusEmoji = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "✅";
      case "claimed": return "🚚";
      case "in_transit": return "🚛";
      case "unclaimed": return "⏳";
      case "cancelled": return "❌";
      default: return "📋";
    }
  };

  if (status === "loading" || loading) {
    return <OrdersSkeleton />;
  }

  const user = session?.user as any;

  return (
    <div className="min-h-screen font-sans" style={{ background: "#0A0E1A", color: "#F0F4FF" }}>

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
              Orders
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                {user?.name?.[0] ?? "U"}
              </div>
              <span className="hidden sm:inline text-sm text-slate-300 font-medium">{user?.name?.split(" ")[0]}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
            >
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 ml-4">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Orders
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {orders.length === 0
                ? "No orders yet"
                : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
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

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/8 p-12 text-center" 
            style={{ background: "#111827" }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ 
                background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.2))",
                border: "1px solid rgba(59,130,246,0.25)"
              }}
            >
              📭
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Orders Yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Place your first order and track it here!
            </p>
            <Link
              href="/customer/orders"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
            >
              🛒 Place Your First Order
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/8 overflow-hidden hover:border-white/15 transition-all cursor-pointer group"
                  style={{ background: "#111827" }}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between"
                    style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.08) 0%, rgba(6,182,212,0.04) 100%)" }}
                  >
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Order ID</p>
                      <p className="text-sm font-bold text-white font-mono tracking-tight">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <StatusPill status={order.delivery_status} />
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4 space-y-4">

                    {/* Total */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Total amount</span>
                      <span className="text-xl font-bold text-white">R{Number(order.total).toFixed(2)}</span>
                    </div>

                    {/* Items */}
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
                        🛒 Items
                      </p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-400">{item.name} × {item.quantity}</span>
                            <span className="text-slate-300 font-medium">
                              R{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-xs text-slate-500 mt-1">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        📍 Delivery Address
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{order.delivery_address}</p>
                    </div>

                    {/* Delivery date/time */}
                    {(order.delivery_date || order.delivery_time) && (
                      <div className="flex flex-wrap gap-2">
                        {order.delivery_date && (
                          <span className="text-xs text-blue-400 px-2 py-1 rounded-full border border-blue-500/20"
                            style={{ background: "rgba(59,130,246,0.1)" }}
                          >
                            📅 {new Date(order.delivery_date).toLocaleDateString()}
                          </span>
                        )}
                        {order.delivery_time && (
                          <span className="text-xs text-cyan-400 px-2 py-1 rounded-full border border-cyan-500/20"
                            style={{ background: "rgba(6,182,212,0.1)" }}
                          >
                            🕐 {order.delivery_time}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Special instructions */}
                    {order.special_instructions && (
                      <div className="rounded-lg p-3 border border-amber-500/20"
                        style={{ background: "rgba(245,158,11,0.08)" }}
                      >
                        <p className="text-xs text-amber-400 font-medium mb-1">📝 Special Instructions</p>
                        <p className="text-xs text-amber-400/80">{order.special_instructions}</p>
                      </div>
                    )}

                    {/* Order date */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/8">
                      <span className="text-xs text-slate-500">Ordered:</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatDate(order.created_at)}
                      </span>
                      <span className="ml-auto text-xs text-slate-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                        {getStatusEmoji(order.delivery_status)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}