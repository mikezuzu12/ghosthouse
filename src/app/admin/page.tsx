"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Stats = {
  totalOrders: number;
  totalDrivers: number;
  totalCustomers: number;
  totalRevenue: string;
  unclaimed: number;
  claimed: number;
  delivered: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  delivery_status: string;
  created_at: string;
};

type Driver = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  role: string;           // "Driver" | "Inactive"
  is_blocked: boolean;    // NEW
  totalDeliveries: number;
  activeOrders: number;
};

type Customer = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  is_blocked: boolean;    // NEW
  totalOrders: number;
  totalSpent: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"overview" | "orders" | "drivers" | "customers">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
    if ((session?.user as any)?.role !== "Admin") router.push("/dashboard");
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tab === "orders") fetchOrders();
    if (tab === "drivers") fetchDrivers();
    if (tab === "customers") fetchCustomers();
  }, [tab, status]);

  useEffect(() => {
    if (tab === "orders") fetchOrders();
  }, [orderFilter, search]);

  async function fetchStats() {
    setLoading(true);
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    setStats(data.stats);
    setLoading(false);
  }

  async function fetchOrders() {
    setLoading(true);
    const res = await fetch(`/api/admin/orders?status=${orderFilter}&search=${search}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  async function fetchDrivers() {
    setLoading(true);
    const res = await fetch("/api/admin/drivers");
    const data = await res.json();
    setDrivers(data.drivers || []);
    setLoading(false);
  }

  async function fetchCustomers() {
    setLoading(true);
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  async function updateOrderStatus(id: string, delivery_status: string) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delivery_status }),
    });
    fetchOrders();
  }

 async function toggleDriver(id: number, currentRole: string) {
  const action = currentRole === "Driver" ? "deactivate" : "activate";
  await fetch("/api/admin/drivers", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action }),
  });
  fetchDrivers();
}

async function toggleBlock(id: number, isBlocked: boolean, type: "drivers" | "customers") {
  await fetch(`/api/admin/${type}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action: isBlocked ? "unblock" : "block" }),
  });
  type === "drivers" ? fetchDrivers() : fetchCustomers();
}

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unclaimed": return "bg-yellow-100 text-yellow-700";
      case "claimed": return "bg-blue-100 text-blue-700";
      case "delivered": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">💧</div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-xl">💧</span>
          </div>
          <div>
            <h1 className="font-bold text-white">AquaPure Admin</h1>
            <p className="text-xs text-gray-400">Management Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden md:block">
            👤 {session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-900 rounded-xl p-1 w-fit">
          {(["overview", "orders", "drivers", "customers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "overview" ? "📊 Overview" :
               t === "orders" ? "📦 Orders" :
               t === "drivers" ? "🚚 Drivers" : "👥 Customers"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && stats && (
          <div className="space-y-8">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Orders", value: stats.totalOrders, icon: "📦", color: "from-blue-600 to-blue-700" },
                { label: "Total Revenue", value: `R${stats.totalRevenue}`, icon: "💰", color: "from-green-600 to-green-700" },
                { label: "Total Drivers", value: stats.totalDrivers, icon: "🚚", color: "from-orange-600 to-orange-700" },
                { label: "Total Customers", value: stats.totalCustomers, icon: "👥", color: "from-purple-600 to-purple-700" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6`}
                >
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/70 text-sm mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-bold text-white mb-6">Order Status Breakdown</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Pending", value: stats.unclaimed, color: "bg-yellow-500", pct: stats.totalOrders ? Math.round((stats.unclaimed / stats.totalOrders) * 100) : 0 },
                  { label: "On the way", value: stats.claimed, color: "bg-blue-500", pct: stats.totalOrders ? Math.round((stats.claimed / stats.totalOrders) * 100) : 0 },
                  { label: "Delivered", value: stats.delivered, color: "bg-green-500", pct: stats.totalOrders ? Math.round((stats.delivered / stats.totalOrders) * 100) : 0 },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 text-sm">{s.label}</span>
                      <span className="text-white font-bold">{s.value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`${s.color} h-2 rounded-full transition-all`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{s.pct}% of total</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setTab("orders")}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-blue-500 transition group"
              >
                <span className="text-3xl mb-3 block">📦</span>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition">Manage Orders</h3>
                <p className="text-gray-400 text-sm mt-1">View and update all orders</p>
              </button>
              <button
                onClick={() => setTab("drivers")}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-blue-500 transition group"
              >
                <span className="text-3xl mb-3 block">🚚</span>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition">Manage Drivers</h3>
                <p className="text-gray-400 text-sm mt-1">View driver performance</p>
              </button>
              <button
                onClick={() => setTab("customers")}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-blue-500 transition group"
              >
                <span className="text-3xl mb-3 block">👥</span>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition">Manage Customers</h3>
                <p className="text-gray-400 text-sm mt-1">View customer accounts</p>
              </button>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="🔍 Search by customer name..."
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex gap-2">
                {["all", "unclaimed", "claimed", "delivered"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrderFilter(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                      orderFilter === s
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 text-gray-400 border border-gray-800 hover:text-white"
                    }`}
                  >
                    {s === "all" ? "All" : s === "unclaimed" ? "Pending" : s === "claimed" ? "On way" : "Delivered"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-800">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-400">No orders found</p>
                </div>
              ) : (
                orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-900 rounded-2xl border border-gray-800 p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-white">{order.customer_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.delivery_status)}`}>
                            {order.delivery_status === "unclaimed" ? "Pending" :
                             order.delivery_status === "claimed" ? "On the way" : "Delivered"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{order.customer_email} · {order.customer_phone}</p>
                        <p className="text-sm text-gray-500 mt-1">📍 {order.delivery_address}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(order.created_at).toLocaleString()} · Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-blue-400">R{Number(order.total).toFixed(2)}</p>
                        <select
                          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 outline-none"
                          value={order.delivery_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="unclaimed">Pending</option>
                          <option value="claimed">On the way</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap gap-2">
                      {order.items?.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Drivers Tab */}
        {tab === "drivers" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-400 text-sm">{drivers.length} drivers registered</p>
    </div>
    {drivers.length === 0 ? (
      <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-800">
        <p className="text-4xl mb-3">🚚</p>
        <p className="text-gray-400">No drivers found</p>
      </div>
    ) : (
      drivers.map((driver) => (
        <motion.div
          key={driver.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                driver.role === "Inactive" ? "bg-gray-600" : "bg-blue-600"
              }`}>
                {driver.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white">{driver.full_name}</p>
                  {driver.role === "Inactive" && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                  {driver.is_blocked && (
                    <span className="text-xs bg-red-900 text-red-400 px-2 py-0.5 rounded-full">Blocked</span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{driver.email}</p>
                <p className="text-sm text-gray-500">{driver.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center hidden md:block">
                <p className="text-xl font-bold text-green-400">{driver.totalDeliveries}</p>
                <p className="text-xs text-gray-500">Delivered</p>
              </div>
              <div className="text-center hidden md:block">
                <p className="text-xl font-bold text-blue-400">{driver.activeOrders}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toggleBlock(driver.id, driver.is_blocked, "drivers")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    driver.is_blocked
                      ? "bg-green-700 hover:bg-green-600 text-white"
                      : "bg-red-700 hover:bg-red-600 text-white"
                  }`}
                >
                  {driver.is_blocked ? "Unblock" : "Block"}
                </button>
                <button
                  onClick={() => toggleDriver(driver.id, driver.role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    driver.role === "Inactive"
                      ? "bg-blue-700 hover:bg-blue-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  {driver.role === "Inactive" ? "Activate" : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))
    )}
  </div>
)}
        

        {/* Customers Tab */}
      {tab === "customers" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-400 text-sm">{customers.length} customers registered</p>
    </div>
    {customers.length === 0 ? (
      <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-800">
        <p className="text-4xl mb-3">👥</p>
        <p className="text-gray-400">No customers found</p>
      </div>
    ) : (
      customers.map((customer) => (
        <motion.div
          key={customer.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                customer.is_blocked ? "bg-red-900" : "bg-purple-600"
              }`}>
                {customer.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white">{customer.full_name}</p>
                  {customer.is_blocked && (
                    <span className="text-xs bg-red-900 text-red-400 px-2 py-0.5 rounded-full">Blocked</span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{customer.email}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center hidden md:block">
                <p className="text-xl font-bold text-blue-400">{customer.totalOrders}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
              <div className="text-center hidden md:block">
                <p className="text-xl font-bold text-green-400">R{customer.totalSpent}</p>
                <p className="text-xs text-gray-500">Spent</p>
              </div>
              <button
                onClick={() => toggleBlock(customer.id, customer.is_blocked, "customers")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  customer.is_blocked
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : "bg-red-700 hover:bg-red-600 text-white"
                }`}
              >
                {customer.is_blocked ? "Unblock" : "Block"}
              </button>
              <p className="text-xs text-gray-500">
                Joined {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      ))
    )}
  </div>
)}
      </div>
    </div>
  );
}