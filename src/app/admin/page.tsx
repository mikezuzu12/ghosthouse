"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Stats = {
  totalUsers: number;
  totalCustomers: number;
  totalDrivers: number;
  totalOrders: number;
  pendingOrders: number;
  claimedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  recentOrders: any[];
  recentUsers: any[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalDrivers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    claimedOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    recentOrders: [],
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, role, full_name, email, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const customers = users?.filter(u => u.role?.toLowerCase() === 'customer') || [];
      const drivers = users?.filter(u => u.role?.toLowerCase() === 'driver') || [];
      const pendingOrders = orders?.filter(o => o.delivery_status === 'pending' || o.delivery_status === 'unclaimed') || [];
      const claimedOrders = orders?.filter(o => o.delivery_status === 'claimed' || o.delivery_status === 'in_transit') || [];
      const deliveredOrders = orders?.filter(o => o.delivery_status === 'delivered') || [];

      // Calculate revenue
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const todayOrders = orders?.filter(o => {
        const today = new Date();
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === today.toDateString();
      }) || [];
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      setStats({
        totalUsers: users?.length || 0,
        totalCustomers: customers.length,
        totalDrivers: drivers.length,
        totalOrders: orders?.length || 0,
        pendingOrders: pendingOrders.length,
        claimedOrders: claimedOrders.length,
        deliveredOrders: deliveredOrders.length,
        totalRevenue,
        todayRevenue,
        recentOrders: orders?.slice(0, 5) || [],
        recentUsers: users?.slice(0, 5) || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
            {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {getGreeting()}, Admin.
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <button
          onClick={fetchStats}
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
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Users", value: stats.totalUsers, icon: "👥", accent: "#3B82F6" },
          { label: "Total Orders", value: stats.totalOrders, icon: "📦", accent: "#8B5CF6" },
          { label: "Total Revenue", value: `R${stats.totalRevenue.toFixed(2)}`, icon: "💰", accent: "#10B981" },
          { label: "Today's Revenue", value: `R${stats.todayRevenue.toFixed(2)}`, icon: "📈", accent: "#06B6D4" },
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
              <span className="text-xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Order Status Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Pending", value: stats.pendingOrders, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
          { label: "In Progress", value: stats.claimedOrders, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
          { label: "Delivered", value: stats.deliveredOrders, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`rounded-xl border p-4 text-center ${stat.border}`}
            style={{ background: stat.bg }}
          >
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: "#111827" }}
        >
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Recent Orders</p>
            <Link href="/admin/orders" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/6">
            {stats.recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">
                No orders yet
              </div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition">
                  <div>
                    <p className="text-sm text-white font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{order.customer_name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">R{order.total?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: "#111827" }}
        >
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Recent Users</p>
            <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/6">
            {stats.recentUsers.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">
                No users yet
              </div>
            ) : (
              stats.recentUsers.map((user) => (
                <div key={user.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition">
                  <div>
                    <p className="text-sm text-white font-medium">{user.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role?.toLowerCase() === 'admin' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : user.role?.toLowerCase() === 'driver'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {user.role || 'Customer'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}