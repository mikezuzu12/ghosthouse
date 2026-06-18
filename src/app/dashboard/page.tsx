"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import OrderChat from "@/app/components/OrderChat";
import ClientOnlyMap from "@/app/components/ClientOnlyMap";
import { motion, AnimatePresence } from "framer-motion";

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

type Order = {
  id: string;
  customer_name: string;
  delivery_address: string;
  delivery_status: string;
  items: any[];
  total: number;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  // Fetch active order
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchOrders = async () => {
      try {
        setError(null);
        const response = await fetch("/api/orders/my-orders");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const claimed = data.orders?.find(
          (o: any) => o.delivery_status === "claimed" || o.delivery_status === "in_transit"
        );
        if (claimed) setActiveOrder(claimed);
        // Get recent orders (last 3)
        const recent = data.orders?.slice(0, 3) || [];
        setRecentOrders(recent);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please refresh the page.");
      }
    };

    fetchOrders();
  }, [status]);

  // Fetch driver location when order is claimed
  useEffect(() => {
    if (!activeOrder) return;

    const fetchLocation = async () => {
      setLoadingLocation(true);
      try {
        // Updated to use /api/drivers/location
        const response = await fetch(`/api/drivers/location?order_id=${activeOrder.id}`);
        
        // Handle 404 gracefully - it just means no location data yet
        if (response.status === 404) {
          console.log("No location data available yet");
          setDriverLocation(null);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.location) {
          setDriverLocation(data.location);
        }
      } catch (err) {
        console.error("Error fetching location:", err);
        // Don't set error for location - it's not critical
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchLocation();

    // Poll for location updates every 10 seconds
    const interval = setInterval(() => {
      // Updated to use /api/drivers/location
      fetch(`/api/drivers/location?order_id=${activeOrder.id}`)
        .then((r) => {
          if (r.status === 404) {
            console.log("No location data available yet");
            return null;
          }
          if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
          return r.json();
        })
        .then((data) => {
          if (data && data.location) {
            setDriverLocation(data.location);
          }
        })
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  // Check for unread messages
  useEffect(() => {
    if (!activeOrder || isChatOpen) return;

    const checkUnreadMessages = async () => {
      try {
        const response = await fetch(`/api/messages?order_id=${activeOrder.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.messages) {
          const user = session?.user as any;
          const myId = Number(user?.id);
          // Count messages from driver that are not from me
          const unread = data.messages.filter(
            (msg: any) => msg.sender_role?.toLowerCase() === "driver" && msg.sender_id !== myId
          ).length;
          setUnreadMessages(unread);
        }
      } catch (error) {
        console.error("Error checking unread messages:", error);
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeOrder, isChatOpen, session]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "claimed": return "text-blue-600 bg-blue-50 border-blue-200";
      case "in_transit": return "text-orange-600 bg-orange-50 border-orange-200";
      case "delivered": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "claimed": return "🚚";
      case "in_transit": return "⏳";
      case "delivered": return "✅";
      default: return "📦";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">💧</div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xl">💧</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800">AquaPure</h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</p>
                <p className="text-sm font-semibold text-gray-700">{currentTime.toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.name?.split(" ")[0]}
                </span>
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
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between"
          >
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200/50 p-6 mb-6 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {getGreeting()}, {user?.name ?? "User"}! 👋
              </h2>
              <p className="text-gray-500 mt-1">
                {activeOrder 
                  ? "Your order is on its way! Track it below." 
                  : "Ready to order some fresh water?"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
        </motion.div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  {[
    { icon: "🛒", label: "Place Order", action: "/customer/orders" },
    { icon: "📋", label: "My Orders", action: "/customer/fullorders" },
    { icon: "💬", label: "Chat Support", action: "#" },
    { icon: "📍", label: "Track Order", action: "#" },
  ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.action === "#" ? (
                <div className="bg-white rounded-xl border border-gray-200/50 p-4 text-center hover:shadow-lg transition cursor-pointer group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition">
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                </div>
              ) : (
                <Link href={item.action}>
                  <div className="bg-white rounded-xl border border-gray-200/50 p-4 text-center hover:shadow-lg transition cursor-pointer group">
                    <div className="text-2xl mb-2 group-hover:scale-110 transition">
                      {item.icon}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Active Order Tracking */}
        {activeOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm mb-6"
          >
            {/* Order Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Active Order</p>
                  <h3 className="text-xl font-bold mt-1">
                    #{activeOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activeOrder.delivery_status)}`}>
                    {getStatusEmoji(activeOrder.delivery_status)} {activeOrder.delivery_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Map & Tracking */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <span>📍</span> Live Tracking
                    </h4>
                    {driverLocation && (
                      <span className="text-xs flex items-center gap-1 text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                  
                  {driverLocation ? (
                    <ClientOnlyMap
                      orderId={activeOrder.id}
                      driverLocation={driverLocation}
                      customerAddress={activeOrder.delivery_address}
                      isDriver={false}
                    />
                  ) : (
                    <div className="h-[300px] bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                      <div className="text-center">
                        <span className="text-4xl block mb-2">⏳</span>
                        <p className="text-gray-500 text-sm">Waiting for driver to start tracking...</p>
                      </div>
                    </div>
                  )}

                  {/* Driver Info */}
                  {driverLocation && (
                    <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">🚚</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{driverLocation.driver_name}</p>
                            <p className="text-xs text-gray-500">Your delivery driver</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Last updated</p>
                          <p className="text-xs font-medium text-gray-700">
                            {new Date(driverLocation.updated_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Order Info & Chat */}
                <div className="space-y-4">
                  {/* Order Details */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span>📦</span> Order Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Address</span>
                        <span className="text-gray-800 text-right max-w-[200px]">{activeOrder.delivery_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="font-bold text-blue-600">${activeOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Items</span>
                        <span className="text-gray-800">{activeOrder.items?.length || 0} items</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ordered</span>
                        <span className="text-gray-800">{new Date(activeOrder.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat with Driver */}
                  <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border ${
                    unreadMessages > 0 && !isChatOpen 
                      ? 'border-blue-400 ring-2 ring-blue-400 ring-opacity-50' 
                      : 'border-blue-100'
                  } transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center relative">
                          <span className="text-white text-lg">💬</span>
                          {unreadMessages > 0 && !isChatOpen && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white animate-pulse">
                              {unreadMessages}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Chat with Driver</p>
                          <p className="text-xs text-gray-500">
                            {unreadMessages > 0 && !isChatOpen 
                              ? `${unreadMessages} new message${unreadMessages > 1 ? 's' : ''}`
                              : 'Get real-time updates'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsChatOpen(!isChatOpen);
                          if (!isChatOpen) setUnreadMessages(0);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          isChatOpen 
                            ? "bg-red-500 text-white hover:bg-red-600" 
                            : unreadMessages > 0
                            ? "bg-blue-600 text-white hover:bg-blue-700 animate-pulse"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isChatOpen ? "Close" : "Open Chat"}
                      </button>
                    </div>
                    {isChatOpen && (
                      <div className="mt-4">
                        <OrderChat 
                          orderId={activeOrder.id} 
                          isDriver={false}
                          customerName={user?.name}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 hover:shadow-md transition cursor-pointer">
                      <p className="text-2xl font-bold text-green-600">⭐</p>
                      <p className="text-xs text-gray-600 mt-1">Rate Driver</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100 hover:shadow-md transition cursor-pointer">
                      <p className="text-2xl font-bold text-purple-600">📞</p>
                      <p className="text-xs text-gray-600 mt-1">Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200/50 p-12 text-center shadow-sm"
          >
            <div className="text-7xl mb-4">💧</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Orders</h3>
            <p className="text-gray-500 mb-6">Ready for some fresh water? Place your first order now!</p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transition hover:-translate-y-0.5"
            >
              <span>🛒</span>
              Place Order Now
            </Link>
          </motion.div>
        )}

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && !activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
              <Link href="/fullorders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200/50 p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.delivery_status)}`}>
                      {order.delivery_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="font-bold text-blue-600">${order.total.toFixed(2)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Chat Button */}
      {activeOrder && !isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsChatOpen(true);
            setUnreadMessages(0);
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-xl transition flex items-center justify-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition">💬</span>
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold animate-bounce">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat Modal */}
      {isChatOpen && activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <p className="font-semibold">Chat with Driver</p>
                <p className="text-xs text-blue-200">Order #{activeOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="h-[400px]">
            <OrderChat 
              orderId={activeOrder.id} 
              isDriver={false}
              customerName={user?.name}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}