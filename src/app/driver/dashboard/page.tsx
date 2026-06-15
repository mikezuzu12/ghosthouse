"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

export default function DriverDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"available" | "claimed" | "delivered">("available");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    available: 0, 
    claimed: 0, 
    delivered: 0,
    totalEarnings: 0 
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const addNotification = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers/orders?status=${tab}`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Fetch error:", data);
        addNotification("Failed to fetch orders", "error");
        return;
      }

      setOrders(data.orders || []);
      setStats(data.stats || { available: 0, claimed: 0, delivered: 0, totalEarnings: 0 });
    } catch (err) {
      console.error("Failed to fetch orders:", err);
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
      console.error(err);
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
      } else {
        const error = await res.json();
        addNotification(error.error || "Failed to mark as delivered", "error");
      }
    } catch (err) {
      console.error(err);
      addNotification("Failed to complete order", "error");
    } finally {
      setCompleting(null);
    }
  }

  const filteredOrders = orders.filter(order => 
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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">💧</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg ${
              notification.type === "success" ? "bg-green-500" :
              notification.type === "error" ? "bg-red-500" : "bg-blue-500"
            } text-white min-w-[250px]`}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modern Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💧</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800">AquaPure Driver Portal</h1>
                <p className="text-xs text-gray-500">{getGreeting()}, {session?.user?.name?.split(" ")[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</p>
                <p className="text-sm font-semibold text-gray-700">{currentTime.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition shadow-md hover:shadow-lg"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Available Orders", value: stats.available, icon: "📦", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
            { label: "Claimed Orders", value: stats.claimed, icon: "🚚", color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
            { label: "Delivered Today", value: stats.delivered, icon: "✅", color: "from-green-500 to-green-600", bg: "bg-green-50" },
            { label: "Today's Earnings", value: `R${stats.totalEarnings || 0}`, icon: "💰", color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bg} rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{stat.icon}</span>
                <span className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Search by customer name, address, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
              {(["available", "claimed", "delivered"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all capitalize flex items-center gap-2 ${
                    tab === t
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{getStatusIcon(t)}</span>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm"
          >
            <div className="text-7xl mb-4">{getStatusIcon(tab)}</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No {tab} orders</h3>
            <p className="text-gray-400">
              {tab === "available"
                ? "New orders will appear here when customers place them."
                : tab === "claimed"
                ? "Claim available orders to see them here."
                : "Delivered orders will appear here for your records."}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">👤</span>
                          <h3 className="font-bold text-gray-800">{order.customer_name || "Customer"}</h3>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">Order #{order.id.slice(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          R{order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View details →
                    </button>
                  </div>

                  {/* Order Body */}
                  <div className="p-5">
                    {/* Address */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span>📍</span>
                        <p className="text-xs font-medium text-gray-500">Delivery Address</p>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{order.delivery_address}</p>
                    </div>

                    {/* Items Preview */}
                    <div className="mb-4 bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span>🛒</span>
                        <p className="text-xs font-medium text-gray-500">Items ({order.items?.length || 0})</p>
                      </div>
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-600">{item.name} × {item.quantity}</span>
                            <span className="text-gray-700">R{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <p className="text-xs text-gray-400 mt-1">+{order.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-1 text-xs text-gray-400 mb-5">
                      <div className="flex justify-between">
                        <span>🕒 Ordered:</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      {order.claimed_at && (
                        <div className="flex justify-between">
                          <span>🚚 Claimed:</span>
                          <span>{new Date(order.claimed_at).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {tab === "available" && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => claimOrder(order.id)}
                        disabled={claiming === order.id}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition shadow-md disabled:opacity-70"
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
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition shadow-md disabled:opacity-70"
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
                      <div className="w-full py-3 bg-green-100 text-green-700 rounded-xl text-center font-semibold flex items-center justify-center gap-2">
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowDetails(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">Order Details</h3>
                    <p className="text-blue-100 text-sm mt-1">Order #{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <button onClick={() => setShowDetails(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Customer Information</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p><span className="text-gray-500">Name:</span> {selectedOrder.customer_name}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedOrder.customer_phone || "Not provided"}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedOrder.customer_email || "Not provided"}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Delivery Address</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p>{selectedOrder.delivery_address}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Order Items</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="font-semibold">R{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>R{selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}