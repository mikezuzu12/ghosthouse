"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Order = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address: string;
  total: number;
  status: string;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      const res = await fetch("/api/orders");
      
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
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_transit":
      case "in transit":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "claimed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "pending":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "✅";
      case "in_transit":
      case "in transit":
        return "🚚";
      case "claimed":
        return "📦";
      case "pending":
        return "⏳";
      case "cancelled":
        return "❌";
      default:
        return "📋";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">All Orders</h1>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-sm animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
            >
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xl">💧</span>
              </div>
              <h1 className="font-bold text-gray-800">AquaPure</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between"
            >
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xl"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">
                All Orders
              </h2>
              <p className="text-gray-500">
                {orders.length === 0
                  ? "No orders yet"
                  : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-md hover:shadow-lg"
            >
              🔄 Refresh
            </button>
          </div>
        </motion.div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200/50 p-12 text-center shadow-sm"
          >
            <div className="text-7xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No Orders Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start your first order and track it here!
            </p>
            <Link
              href="/customer/orders"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transition hover:-translate-y-0.5"
            >
              <span>🛒</span>
              Place Your First Order
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
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Order ID
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          #{order.id}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusEmoji(order.status)} {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Customer Info */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Customer
                      </p>
                      <p className="font-semibold text-gray-800">{order.name}</p>
                      <p className="text-sm text-gray-500">{order.email}</p>
                    </div>

                    {/* Contact & Address */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {order.phone && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Phone
                          </p>
                          <p className="text-gray-700 font-medium">{order.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Total
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          R${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        📍 Delivery Address
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {order.address}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span className="font-medium">Ordered on:</span>{" "}
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200/50">
                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm group-hover:shadow-md">
                      View Details →
                    </button>
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