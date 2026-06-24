"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Driver = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  vehicle_type: string;
  vehicle_registration: string;
  created_at: string;
  status: 'active' | 'idle' | 'offline';
  total_orders: number;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'Driver')
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      // Fetch order counts for each driver
      const driversWithOrders = await Promise.all(
        (driversData || []).map(async (driver) => {
          const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', driver.id);

          return {
            ...driver,
            total_orders: count || 0,
            status: 'idle' as const,
          };
        })
      );

      setDrivers(driversWithOrders);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    } else if (status === 'idle') {
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    }
    return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading drivers...</p>
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage all delivery drivers
          </p>
        </div>
        <button
          onClick={fetchDrivers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
        >
          🔄 Refresh
        </button>
      </motion.div>

      {/* ── Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          style={{ background: "rgba(255,255,255,0.05)", color: "#F0F4FF" }}
        />
      </motion.div>

      {/* ── Drivers Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredDrivers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full rounded-2xl border border-white/8 p-12 text-center"
              style={{ background: "#111827" }}
            >
              <p className="text-slate-500 text-sm">No drivers found</p>
            </motion.div>
          ) : (
            filteredDrivers.map((driver, index) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-white/8 p-5 hover:border-white/15 transition-all"
                style={{ background: "#111827" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                    {driver.full_name?.[0] || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{driver.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 truncate">{driver.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="text-slate-300">{driver.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="text-slate-300">{driver.vehicle_type || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">License</span>
                    <span className="text-slate-300">{driver.license_number || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Orders</span>
                    <span className="text-white font-bold">{driver.total_orders}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/8">
                    <span className="text-slate-500">Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(driver.status)}`}>
                      {driver.status || 'Offline'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}