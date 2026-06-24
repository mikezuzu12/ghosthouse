"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const products = [
  { id: 1, name: "Still Water 5L",     price: 3.99,  description: "Pure still water, perfect for home use",    icon: "💧", popular: false, category: "still" },
  { id: 2, name: "Still Water 10L",    price: 6.99,  description: "Large still water for families",            icon: "💙", popular: true,  category: "still" },
  { id: 3, name: "Sparkling Water 5L", price: 4.99,  description: "Lightly sparkling, refreshing taste",       icon: "✨", popular: false, category: "sparkling" },
  { id: 4, name: "Alkaline Water 5L",  price: 5.99,  description: "pH balanced alkaline water",                icon: "⚡", popular: false, category: "premium" },
  { id: 5, name: "Office Pack 20L",    price: 12.99, description: "Bulk supply for offices",                   icon: "🏢", popular: true,  category: "bulk" },
  { id: 6, name: "Monthly Plan 50L",   price: 29.99, description: "Best value — monthly subscription",        icon: "📅", popular: true,  category: "subscription" },
];

const CATEGORIES = ["all", "still", "sparkling", "premium", "bulk", "subscription"];

export default function OrderPage() {
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [form, setForm] = useState({
    name: "", email: "", address: "", phone: "",
    specialInstructions: "", deliveryDate: "",
    deliveryTime: "Morning (9AM-12PM)",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCart, setShowCart] = useState(false);

  function updateCart(id: number, change: number) {
    setCart((prev) => {
      const updated = (prev[id] || 0) + change;
      if (updated <= 0) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: updated };
    });
  }

  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const filteredProducts = selectedCategory === "all" ? products : products.filter(p => p.category === selectedCategory);

  async function handleSubmit() {
    if (!form.name || !form.email || !form.address || !form.phone) { alert("Please fill in all required fields."); return; }
    if (cartItems.length === 0) { alert("Your cart is empty."); return; }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cartItems.map(p => ({ id: p.id, name: p.name, quantity: cart[p.id], price: p.price })),
          total: total.toFixed(2),
        }),
      });
      const text = await res.text();
      if (!text.trim()) { alert("Server returned empty response."); return; }
      let data;
      try { data = JSON.parse(text); } catch { alert("Server error. Please try again."); return; }
      if (!res.ok) { alert(data.error || "Something went wrong."); return; }
      setOrderId(data.order?.id || Math.random().toString(36).substr(2, 9));
      setSubmitted(true);
    } catch { alert("Failed to place order. Please try again."); }
    finally { setIsProcessing(false); }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0A0E1A" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden" style={{ background: "#111827" }}>
          <div className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-1">Order Confirmed</h2>
            <p className="text-slate-400 text-sm mb-6">Thanks, {form.name}. Your water is on its way.</p>

            <div className="rounded-xl border border-white/8 p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Order ID</p>
              <p className="text-lg font-mono font-bold" style={{ color: "#06B6D4" }}>
                #{typeof orderId === "string" ? orderId.slice(0, 8).toUpperCase() : orderId}
              </p>
            </div>

            <div className="rounded-xl border border-white/8 p-4 mb-6 text-left space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Delivery Details</p>
              <p className="text-sm text-slate-200">{form.address}</p>
              <p className="text-xs text-slate-500">
                {form.deliveryDate ? new Date(form.deliveryDate).toLocaleDateString() : "As soon as possible"} · {form.deliveryTime}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setSubmitted(false); setCart({}); setForm({ name:"",email:"",address:"",phone:"",specialInstructions:"",deliveryDate:"",deliveryTime:"Morning (9AM-12PM)" }); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                New Order
              </button>
              <Link href="/fullorders"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition text-center">
                View Orders
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans" style={{ background: "#0A0E1A", color: "#F0F4FF" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl" style={{ background: "rgba(10,14,26,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>💧</div>
            <span className="font-bold text-white tracking-tight text-sm">AquaPure</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5">
              ← Dashboard
            </Link>
            <button onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm text-slate-300 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                  style={{ background: "#EF4444" }}>{itemCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.7)" }}
              onClick={() => setShowCart(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col border-l border-white/10"
              style={{ background: "#111827" }}>
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <p className="font-semibold text-white">Your Cart</p>
                <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white transition text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>🛒</div>
                    <p className="text-slate-500 text-sm">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map(p => (
                      <div key={p.id} className="flex gap-3 p-3 rounded-xl border border-white/8"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-2xl flex-shrink-0 mt-0.5">{p.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">R{p.price.toFixed(2)} each</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateCart(p.id, -1)}
                              className="w-7 h-7 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 flex items-center justify-center text-sm transition">−</button>
                            <span className="text-sm font-semibold text-white w-4 text-center">{cart[p.id]}</span>
                            <button onClick={() => updateCart(p.id, 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm transition"
                              style={{ background: "rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.4)" }}>+</button>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: "#06B6D4" }}>R{(p.price * cart[p.id]).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-white/8 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-sm">Total</span>
                    <span className="text-xl font-bold text-white">R{total.toFixed(2)}</span>
                  </div>
                  <button onClick={() => setShowCart(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">AquaPure Store</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Order Fresh Water</h1>
          <p className="text-slate-400 text-sm mt-1">Pure, clean water delivered to your doorstep.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Products */}
          <div className="lg:col-span-2 space-y-5">

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? "text-white border-blue-500/50"
                      : "text-slate-400 border-white/10 hover:text-white hover:border-white/20"
                  }`}
                  style={selectedCategory === cat ? { background: "rgba(59,130,246,0.2)" } : { background: "rgba(255,255,255,0.04)" }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative rounded-xl border border-white/8 p-5 hover:border-white/15 transition-all cursor-default overflow-hidden"
                  style={{ background: "#111827" }}>
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />

                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{product.icon}</span>
                    {product.popular && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308", border: "1px solid rgba(234,179,8,0.25)" }}>
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-1">{product.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">R{product.price.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCart(product.id, -1)}
                        className="w-8 h-8 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 flex items-center justify-center text-sm transition">
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-white">{cart[product.id] || 0}</span>
                      <button onClick={() => updateCart(product.id, 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold transition hover:opacity-80"
                        style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Checkout panel */}
          <div className="lg:sticky lg:top-20 h-fit">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>

              {/* Panel header */}
              <div className="px-5 py-4 border-b border-white/8"
                style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(6,182,212,0.05) 100%)" }}>
                <p className="text-sm font-semibold text-white">Checkout</p>
                <p className="text-xs text-slate-400 mt-0.5">Complete your delivery details</p>
              </div>

              <div className="p-5 space-y-4">

                {/* Cart summary */}
                {itemCount > 0 ? (
                  <div className="rounded-xl border border-white/8 p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                      <span className="text-sm font-bold text-white">R{total.toFixed(2)}</span>
                    </div>
                    {cartItems.map(p => (
                      <div key={p.id} className="flex justify-between text-xs text-slate-500">
                        <span>{p.name} × {cart[p.id]}</span>
                        <span>R{(p.price * cart[p.id]).toFixed(2)}</span>
                      </div>
                    ))}
                    <button onClick={() => setShowCart(true)} className="text-xs transition" style={{ color: "#06B6D4" }}>
                      Edit cart →
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                    <p className="text-xs text-slate-600">Add items from the left to get started</p>
                  </div>
                )}

                {/* Form */}
                <div className="space-y-2.5">
                  {[
                    { placeholder: "Full name *",  field: "name",  type: "text" },
                    { placeholder: "Email *",       field: "email", type: "email" },
                    { placeholder: "Phone *",       field: "phone", type: "tel" },
                  ].map(({ placeholder, field, type }) => (
                    <input key={field} type={type} placeholder={placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                      value={form[field as keyof typeof form]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })} />
                  ))}

                  <textarea placeholder="Delivery address *" rows={2}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} />

                  <div className="grid grid-cols-2 gap-2.5">
                    <input type="date"
                      className="rounded-xl px-3 py-2.5 text-sm outline-none transition text-white border border-white/8 focus:border-blue-500/50"
                      style={{ background: "rgba(255,255,255,0.04)", colorScheme: "dark" }}
                      value={form.deliveryDate}
                      onChange={e => setForm({ ...form, deliveryDate: e.target.value })} />
                    <select className="rounded-xl px-3 py-2.5 text-sm outline-none transition text-white border border-white/8 focus:border-blue-500/50"
                      style={{ background: "#1a2332" }}
                      value={form.deliveryTime}
                      onChange={e => setForm({ ...form, deliveryTime: e.target.value })}>
                      <option>Morning (9AM-12PM)</option>
                      <option>Afternoon (12PM-3PM)</option>
                      <option>Evening (3PM-6PM)</option>
                    </select>
                  </div>

                  <textarea placeholder="Special instructions (optional)" rows={2}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    value={form.specialInstructions}
                    onChange={e => setForm({ ...form, specialInstructions: e.target.value })} />
                </div>

                <button onClick={handleSubmit} disabled={itemCount === 0 || isProcessing}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-98"
                  style={{ background: itemCount === 0 || isProcessing ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing…
                    </span>
                  ) : itemCount > 0 ? `Confirm Order · R${total.toFixed(2)}` : "Add items to order"}
                </button>

                <p className="text-xs text-slate-600 text-center">By confirming you agree to our Terms of Service</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}