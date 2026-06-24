"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type AnalyticsData = {
  dailyOrders: { date: string; count: number; revenue: number }[];
  weeklyOrders: { week: string; count: number; revenue: number }[];
  monthlyOrders: { month: string; count: number; revenue: number }[];
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: { name: string; orders: number; total: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    dailyOrders: [],
    weeklyOrders: [],
    monthlyOrders: [],
    totalRevenue: 0,
    averageOrderValue: 0,
    topCustomers: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data for analytics
      const dailyData: { [key: string]: { count: number; revenue: number } } = {};
      const weeklyData: { [key: string]: { count: number; revenue: number } } = {};
      const monthlyData: { [key: string]: { count: number; revenue: number } } = {};
      const customerData: { [key: string]: { name: string; orders: number; total: number } } = {};

      let totalRevenue = 0;

      orders?.forEach((order) => {
        const date = new Date(order.created_at);
        const dayKey = date.toISOString().split('T')[0];
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Daily
        if (!dailyData[dayKey]) dailyData[dayKey] = { count: 0, revenue: 0 };
        dailyData[dayKey].count++;
        dailyData[dayKey].revenue += order.total || 0;

        // Weekly
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { count: 0, revenue: 0 };
        weeklyData[weekKey].count++;
        weeklyData[weekKey].revenue += order.total || 0;

        // Monthly
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { count: 0, revenue: 0 };
        monthlyData[monthKey].count++;
        monthlyData[monthKey].revenue += order.total || 0;

        // Customer
        const customerName = order.customer_name || 'Unknown';
        if (!customerData[customerName]) {
          customerData[customerName] = { name: customerName, orders: 0, total: 0 };
        }
        customerData[customerName].orders++;
        customerData[customerName].total += order.total || 0;

        totalRevenue += order.total || 0;
      });

      const dailyOrders = Object.entries(dailyData).map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue,
      }));

      const weeklyOrders = Object.entries(weeklyData).map(([week, data]) => ({
        week,
        count: data.count,
        revenue: data.revenue,
      }));

      const monthlyOrders = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        count: data.count,
        revenue: data.revenue,
      }));

      const topCustomers = Object.values(customerData)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const averageOrderValue = orders?.length > 0 ? totalRevenue / orders.length : 0;

      setData({
        dailyOrders: dailyOrders.slice(-7),
        weeklyOrders: weeklyOrders.slice(-4),
        monthlyOrders: monthlyOrders.slice(-6),
        totalRevenue,
        averageOrderValue,
        topCustomers,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const getChartData = () => {
    if (period === 'daily') return data.dailyOrders;
    if (period === 'weekly') return data.weeklyOrders;
    return data.monthlyOrders;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your business performance
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
        >
          🔄 Refresh
        </button>
      </motion.div>

      {/* ── Summary Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[
          { label: "Total Revenue", value: `R${data.totalRevenue.toFixed(2)}`, icon: "💰", accent: "#10B981" },
          { label: "Average Order Value", value: `R${data.averageOrderValue.toFixed(2)}`, icon: "📊", accent: "#3B82F6" },
          { label: "Total Orders", value: chartData.reduce((sum, d) => sum + d.count, 0), icon: "📦", accent: "#8B5CF6" },
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

      {/* ── Chart Controls ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              period === p
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={period === p ? { background: "linear-gradient(135deg,#3B82F6,#06B6D4)" } : { background: "rgba(255,255,255,0.05)" }}
          >
            {p}
          </button>
        ))}
      </motion.div>

      {/* ── Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-white/8 p-6"
        style={{ background: "#111827" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">
          {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} Orders
        </h3>
        <div className="space-y-4">
          {chartData.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No data available</p>
          ) : (
            chartData.map((item, index) => {
              const maxCount = Math.max(...chartData.map(d => d.count), 1);
              const percentage = (item.count / maxCount) * 100;
              const label = 'date' in item ? item.date : 'week' in item ? item.week : item.month;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-medium">{item.count} orders</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: "linear-gradient(90deg,#3B82F6,#06B6D4)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">R{item.revenue.toFixed(2)}</p>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* ── Top Customers ── */}
      {data.topCustomers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: "#111827" }}
        >
          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-sm font-semibold text-white">Top Customers</p>
          </div>
          <div className="divide-y divide-white/6">
            {data.topCustomers.map((customer, index) => (
              <div key={index} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition">
                <div>
                  <p className="text-sm text-white font-medium">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.orders} orders</p>
                </div>
                <p className="text-sm font-bold text-white">R{customer.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}