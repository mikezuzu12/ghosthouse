"use client";

import { useAuth } from '@/hook/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth({ requiredRole: 'admin' });
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (user?.role?.toLowerCase() !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Orders', href: '/admin/orders', icon: '📦' },
    { name: 'Drivers', href: '/admin/drivers', icon: '🚚' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
  ];

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
            <span className="hidden sm:inline text-xs text-amber-400 font-medium border-l border-white/10 pl-2.5 ml-0.5">
              Admin
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {currentTime.toLocaleTimeString()}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#8B5CF6,#06B6D4)" }}>
                {user?.name?.[0] ?? "A"}
              </div>
              <span className="hidden sm:inline text-sm text-slate-300 font-medium">
                {user?.name?.split(" ")[0]}
              </span>
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

      {/* ── Sidebar ── */}
      <div className="flex">
        <aside className="w-48 border-r border-white/8 min-h-[calc(100vh-56px)] p-4" style={{ background: "rgba(17,24,39,0.5)" }}>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 hover:text-white"
                style={{ 
                  color: typeof window !== 'undefined' && window.location.pathname === item.href 
                    ? '#F0F4FF' 
                    : '#94A3B8',
                  background: typeof window !== 'undefined' && window.location.pathname === item.href 
                    ? 'rgba(59,130,246,0.15)' 
                    : 'transparent',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}