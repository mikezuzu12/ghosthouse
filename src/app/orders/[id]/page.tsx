"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/app/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-white/5 rounded-xl animate-pulse" />
  ),
});

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  delivery_status: string;
  special_instructions?: string;
  delivery_date?: string;
  delivery_time?: string;
  created_at: string;
  claimed_at?: string;
  delivered_at?: string;
  driver_id?: number;
};

type DriverLocation = {
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  unclaimed: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: "⏳" },
  claimed:   { label: "On the way", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: "🚚" },
  delivered: { label: "Delivered", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: "✅" },
};

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user as any;
  const userRole = user?.role;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && orderId) {
      fetchOrder();
    }
  }, [status, orderId]);

  // Poll driver location if order is claimed
  useEffect(() => {
    if (!order || order.delivery_status !== "claimed") return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/drivers/location?order_id=${orderId}`);
        const data = await res.json();
        if (data.location) setDriverLocation(data.location);
      } catch (err) {
        console.error("Location fetch error:", err);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [order?.delivery_status, orderId]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 404) {
        setError("Order not found.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load order.");
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setError("Network error loading order.");
    } finally {
      setLoading(false);
    }
  }

  const statusCfg = order ? (STATUS_CONFIG[order.delivery_status] ?? { label: order.delivery_status, color: "text-slate-400", bg: "bg-white/5 border-white/10", icon: "📋" }) : null;

  const backHref = userRole === "Admin" ? "/admin" : userRole === "Driver" ? "/driver/dashboard" : "/dashboard";

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <Link href={backHref} className="text-blue-400 hover:text-blue-300 text-sm">
            ← Go back
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen font-sans" style={{ background: "#0A0E1A", color: "#F0F4FF" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl" style={{ background: "rgba(10,14,26,0.85)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={backHref} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-sm font-bold text-white">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <div className="w-16" /> {/* spacer */}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 flex items-center justify-between ${statusCfg?.bg}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{statusCfg?.icon}</span>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Order Status</p>
              <p className={`text-xl font-bold ${statusCfg?.color}`}>{statusCfg?.label}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Placed {new Date(order.created_at).toLocaleDateString()}</p>
            <p>{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/8 p-5"
            style={{ background: "#111827" }}
          >
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              👤 Customer
            </h2>
            <div className="space-y-3">
              {[
                { label: "Name", value: order.customer_name },
                { label: "Email", value: order.customer_email },
                { label: "Phone", value: order.customer_phone || "Not provided" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-200 text-right max-w-[60%] break-words">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Delivery Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 p-5"
            style={{ background: "#111827" }}
          >
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              📍 Delivery
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Address</p>
                <p className="text-slate-200">{order.delivery_address}</p>
              </div>
              {order.delivery_date && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="text-slate-200">{order.delivery_date}</span>
                </div>
              )}
              {order.delivery_time && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="text-slate-200">{order.delivery_time}</span>
                </div>
              )}
              {order.claimed_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Claimed</span>
                  <span className="text-slate-200">{new Date(order.claimed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivered</span>
                  <span className="text-slate-200">{new Date(order.delivered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/8 p-5"
          style={{ background: "#111827" }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
            🛒 Items
          </h2>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
                <div>
                  <p className="text-slate-200 font-medium">{item.name}</p>
                  <p className="text-slate-500 text-xs">× {item.quantity} @ R{item.price.toFixed(2)} each</p>
                </div>
                <p className="text-white font-semibold">R{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 font-bold">
              <span className="text-white">Total</span>
              <span className="text-xl text-white">R{Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Special Instructions */}
        {order.special_instructions && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5"
          >
            <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-2">
              📝 Special Instructions
            </h2>
            <p className="text-slate-300 text-sm">{order.special_instructions}</p>
          </motion.div>
        )}

        {/* Live Map — only show if order is claimed */}
        {order.delivery_status === "claimed" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-white/8 p-5"
            style={{ background: "#111827" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                📍 Live Tracking
              </h2>
              {driverLocation && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                  driverLocation.status === "active"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-400 bg-white/5 border-white/10"
                }`}>
                  {driverLocation.status === "active" ? "🟢 Driver online" : "⚪ Driver offline"}
                </span>
              )}
            </div>
            <MapComponent
              orderId={orderId}
              driverLocation={driverLocation ?? undefined}
              customerAddress={order.delivery_address}
            />
            {!driverLocation && (
              <p className="text-slate-500 text-xs text-center mt-3">
                Waiting for driver to share location...
              </p>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}