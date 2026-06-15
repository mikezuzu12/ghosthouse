"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  customer_name: string;    // ← matches Supabase column
  customer_phone: string;   // ← matches Supabase column
  customer_email: string;   // ← matches Supabase column
  delivery_address: string; // ← matches Supabase column
  items: { name: string; quantity: number; price: number }[];
  total: number;
  delivery_status: string;
  claimed_at: string;
  delivered_at: string;
  created_at: string;
};

type Stats = {
  claimed: number;
  delivered: number;
  available: number;
};

export default function DriverDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"available" | "claimed" | "delivered">("available");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ claimed: 0, delivered: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  // ✅ Fix 1 — wait for loading to finish before redirecting
useEffect(() => {
  if (status === "loading") return;
  if (status === "unauthenticated") router.push("/login");
}, [status, router]);

// ✅ Fix 2 — only fetch orders when session is confirmed
useEffect(() => {
  if (status === "authenticated") {
    fetchOrders();
  }
}, [tab, status]);

  async function fetchOrders() {
  setLoading(true);
  const res = await fetch(`/api/drivers/orders?status=${tab}`);
  const data = await res.json();
  console.log("API RESPONSE:", data); // ← add this line
  setOrders(data.orders || []);
  setStats(data.stats || { claimed: 0, delivered: 0, available: 0 });
  setLoading(false);
}

  async function claimOrder(id: string) {
    setClaiming(id);
    const res = await fetch(`/api/drivers/orders/${id}/claim`, { method: "POST" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setStats((prev) => ({ ...prev, available: prev.available - 1, claimed: prev.claimed + 1 }));
    }
    setClaiming(null);
  }

  async function completeOrder(id: string) {
    setCompleting(id);
    const res = await fetch(`/api/drivers/orders/${id}/complete`, { method: "POST" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setStats((prev) => ({ ...prev, claimed: prev.claimed - 1, delivered: prev.delivered + 1 }));
    }
    setCompleting(null);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#E6F1FB] flex items-center justify-center">
        <p className="text-[#185FA5]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6F1FB]">

      {/* Navbar */}
      <nav className="bg-[#042C53] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#85B7EB] text-xl">💧</span>
          <span className="text-white font-semibold">AquaPure</span>
          <span className="ml-2 bg-[#185FA5] text-[#85B7EB] text-xs px-2 py-0.5 rounded-full">
            Driver
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#B5D4F4] text-sm hidden md:block">
            👤 {session?.user?.name}
          </span>
          <button
            className="text-xs bg-red-500 text-white px-4 py-1.5 rounded-full hover:bg-red-600 transition"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#042C53]">
            Good day, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[#185FA5] text-sm mt-1">
            Here are your deliveries for today
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Available", value: stats.available, color: "bg-green-50 text-green-600 border-green-100" },
            { label: "Claimed", value: stats.claimed, color: "bg-orange-50 text-orange-500 border-orange-100" },
            { label: "Delivered", value: stats.delivered, color: "bg-[#E6F1FB] text-[#185FA5] border-[#B5D4F4]" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-full p-1 border border-[#B5D4F4] w-fit">
          {(["available", "claimed", "delivered"] as const).map((t) => (
            <button
              key={t}
              className={`px-5 py-2 rounded-full text-sm font-medium transition capitalize ${
                tab === t
                  ? "bg-[#185FA5] text-white"
                  : "text-[#185FA5] hover:bg-[#E6F1FB]"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <p className="text-[#185FA5] text-center py-10">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#B5D4F4] p-10 text-center">
            <p className="text-4xl mb-3">
              {tab === "available" ? "📦" : tab === "claimed" ? "🚚" : "✅"}
            </p>
            <p className="text-gray-400 text-sm">
              {tab === "available"
                ? "No available orders right now."
                : tab === "claimed"
                ? "You haven't claimed any orders yet."
                : "No delivered orders yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#B5D4F4] p-5 shadow-sm"
              >
                {/* Order header */}
               
<div className="flex justify-between items-start mb-3">
  <div>
    <p className="font-semibold text-[#042C53] text-base">
      {order.customer_name}  {/* ← was order.name */}
    </p>
    <p className="text-xs text-gray-400 mt-0.5">
      📞 {order.customer_phone}  {/* ← was order.phone */}
    </p>
  </div>
  <p className="font-bold text-[#185FA5] text-lg">
    R{Number(order.total).toFixed(2)}
  </p>
</div>

{/* Address */}
<div className="bg-[#E6F1FB] rounded-lg px-3 py-2 mb-3">
  <p className="text-xs text-[#185FA5] font-medium">📍 Delivery address</p>
  <p className="text-sm text-[#042C53] mt-0.5">{order.delivery_address}</p>
</div>

                {/* Items */}
                <div className="border-t border-[#E6F1FB] pt-3 mb-4 space-y-1">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-500">
                      <span>{item.name} × {item.quantity}</span>
                      <span>R{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Timestamp */}
                <p className="text-xs text-gray-300 mb-3">
                  Ordered: {new Date(order.created_at).toLocaleString()}
                  {order.claimed_at && ` · Claimed: ${new Date(order.claimed_at).toLocaleString()}`}
                </p>

                {/* Actions */}
                {tab === "available" && (
                  <button
                    className="w-full py-2.5 bg-[#185FA5] text-white rounded-full text-sm font-medium hover:bg-[#042C53] transition disabled:opacity-60"
                    onClick={() => claimOrder(order.id)}
                    disabled={claiming === order.id}
                  >
                    {claiming === order.id ? "Claiming..." : "Claim this order →"}
                  </button>
                )}

                {tab === "claimed" && (
                  <button
                    className="w-full py-2.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition disabled:opacity-60"
                    onClick={() => completeOrder(order.id)}
                    disabled={completing === order.id}
                  >
                    {completing === order.id ? "Updating..." : "✓ Mark as delivered"}
                  </button>
                )}

                {tab === "delivered" && (
                  <div className="w-full py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium text-center">
                    ✓ Delivered
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}