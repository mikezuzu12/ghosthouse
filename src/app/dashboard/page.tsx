"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import OrderChat from "@/app/components/OrderChat";
import ClientOnlyMap from "@/app/components/ClientOnlyMap";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/app/components/NotificationBell";
import { useAuth } from '@/hook/useAuth';

type Location = {
  id: string;
  driver_id: number;
  driver_name: string;
  order_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: "active" | "idle" | "offline";
  updated_at: string;
};

type Order = {
  id: string;
  customer_name: string;
  delivery_address: string;
  delivery_status: string;
  items: any[];
  total: number;
  created_at: string;
};

// ── Navbar Chat Popover ───────────────────────────────────────────────────────
function NavbarChat({ orderId, userName }: { orderId: string; userName?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
          open
            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="hidden sm:inline">Driver Chat</span>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-[360px] sm:w-[400px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: "#111827" }}
          >
            <div className="h-[480px]">
              <OrderChat orderId={orderId} isDriver={false} customerName={userName} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    claimed:    { label: "Driver Assigned", color: "text-blue-400 bg-blue-500/10 border-blue-500/30",    dot: "bg-blue-400" },
    in_transit: { label: "On the Way",      color: "text-amber-400 bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
    delivered:  { label: "Delivered",       color: "text-green-400 bg-green-500/10 border-green-500/30", dot: "bg-green-400" },
  };
  const s = map[status] ?? { label: status, color: "text-slate-400 bg-white/5 border-white/10", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  // ── ALL HOOKS MUST BE CALLED AT THE TOP LEVEL ──
  // ✅ All hooks called before any conditional returns
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isLoading, isAuthenticated } = useAuth({ requiredRole: 'customer' });
  
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // ── All useEffect hooks at the top level ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders/my-orders")
      .then((r) => r.json())
      .then((data) => {
        const claimed = data.orders?.find(
          (o: any) => o.delivery_status === "claimed" || o.delivery_status === "in_transit"
        );
        if (claimed) setActiveOrder(claimed);
        setRecentOrders(data.orders?.slice(0, 5) || []);
      })
      .catch(() => setError("Failed to load orders."));
  }, [status]);

  useEffect(() => {
    if (!activeOrder) return;
    const fetchLoc = () =>
      fetch(`/api/drivers/location?order_id=${activeOrder.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.location && setDriverLocation(d.location))
        .catch(() => {});
    fetchLoc();
    const iv = setInterval(fetchLoc, 10000);
    return () => clearInterval(iv);
  }, [activeOrder]);

  // ── NOW it's safe to do conditional returns (after all hooks) ──
  
  // Auth check (after all hooks)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // ── Rest of your dashboard code ──
  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
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
            <span className="hidden sm:inline text-xs text-slate-600 font-medium border-l border-white/10 pl-2.5 ml-0.5">Customer</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {currentTime.toLocaleTimeString()}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            
            {activeOrder && <NavbarChat orderId={activeOrder.id} userName={user?.name} />}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                {user?.name?.[0] ?? "U"}
              </div>
              <span className="hidden sm:inline text-sm text-slate-300 font-medium">{user?.name?.split(" ")[0]}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 ml-4">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"}.
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {activeOrder ? "You have an active delivery in progress." : "No active orders right now."}
            </p>
          </div>
          <Link href="/customer/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </Link>
        </motion.div>

        {/* Quick nav */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "🛒", label: "Place Order",    href: "/customer/orders",    accent: "#3B82F6" },
            { icon: "📋", label: "Order History",  href: "/customer/fullorders", accent: "#8B5CF6" },
            { icon: "📍", label: "Track Delivery", href: "#",                   accent: "#06B6D4" },
            { icon: "🎧", label: "Support",         href: "#",                   accent: "#10B981" },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
              <Link href={item.href}>
                <div className="group relative rounded-xl border border-white/8 p-4 hover:border-white/15 transition-all cursor-pointer overflow-hidden"
                  style={{ background: "#111827" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${item.accent}18 0%, transparent 70%)` }} />
                  <div className="text-xl mb-2">{item.icon}</div>
                  <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{item.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Active order card */}
        {activeOrder ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>

            {/* Banner */}
            <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center justify-between gap-3"
              style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(6,182,212,0.05) 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full border border-blue-500/40 flex items-center justify-center text-lg"
                    style={{ background: "rgba(59,130,246,0.15)" }}>
                    🚚
                  </div>
                  <span className="absolute inset-0 rounded-full border border-blue-400/50 animate-ping" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Delivery</p>
                  <p className="text-white font-bold tracking-tight">#{activeOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={activeOrder.delivery_status} />
                <span className="text-lg font-bold text-white">R{activeOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Map */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Live Tracking</p>
                  {driverLocation && (
                    <span className="text-xs text-green-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden border border-white/8" style={{ height: 280 }}>
                  {driverLocation ? (
                    <ClientOnlyMap
                      orderId={activeOrder.id}
                      driverLocation={driverLocation}
                      customerAddress={activeOrder.delivery_address}
                      isDriver={false}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3" style={{ background: "#0D1520" }}>
                      <div className="w-12 h-12 rounded-full border border-blue-500/30 flex items-center justify-center"
                        style={{ background: "rgba(59,130,246,0.1)" }}>
                        <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-sm">Waiting for driver location…</p>
                    </div>
                  )}
                </div>

                {driverLocation && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8"
                    style={{ background: "rgba(59,130,246,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                        {driverLocation.driver_name?.[0] ?? "D"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{driverLocation.driver_name}</p>
                        <p className="text-xs text-slate-500">Your driver</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">
                      {new Date(driverLocation.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Order details */}
                <div className="rounded-xl border border-white/8 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Order Details</p>
                  {[
                    { label: "Address", value: activeOrder.delivery_address },
                    { label: "Items",   value: `${activeOrder.items?.length ?? 0} item${activeOrder.items?.length !== 1 ? "s" : ""}` },
                    { label: "Placed",  value: new Date(activeOrder.created_at).toLocaleDateString() },
                    { label: "Total",   value: `R${activeOrder.total.toFixed(2)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start gap-2">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs text-slate-200 text-right max-w-[160px]">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Chat toggle */}
                <button
                  onClick={() => setChatOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 hover:border-blue-500/30 transition-all group"
                  style={{ background: chatOpen ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-200">Message Driver</span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${chatOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {chatOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 380 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl overflow-hidden border border-white/8"
                    >
                      <OrderChat orderId={activeOrder.id} isDriver={false} customerName={user?.name} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "⭐", label: "Rate Driver" },
                    { icon: "📞", label: "Support" },
                  ].map((a) => (
                    <button key={a.label}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8 hover:border-white/15 hover:bg-white/5 transition-all"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className="text-lg">{a.icon}</span>
                      <span className="text-xs text-slate-500 font-medium">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 p-12 text-center" style={{ background: "#111827" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.2))", border: "1px solid rgba(59,130,246,0.25)" }}>
              💧
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Delivery</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">You don't have an order in progress. Ready to restock?</p>
            <Link href="/customer/orders"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
              Place an Order
            </Link>
          </motion.div>
        )}

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Order History</p>
              <Link href="/customer/fullorders" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-white/6">
              {recentOrders.map((order) => (
                <div key={order.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-white/3 transition-colors cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      📦
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusPill status={order.delivery_status} />
                    <span className="text-sm font-bold text-white">R{order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}