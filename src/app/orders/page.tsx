"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const products = [
  { 
    id: 1, 
    name: "Still Water 5L", 
    price: 3.99, 
    description: "Pure still water, perfect for home use",
    icon: "💧",
    popular: false,
    category: "still"
  },
  { 
    id: 2, 
    name: "Still Water 10L", 
    price: 6.99, 
    description: "Large still water for families",
    icon: "💙",
    popular: true,
    category: "still"
  },
  { 
    id: 3, 
    name: "Sparkling Water 5L", 
    price: 4.99, 
    description: "Lightly sparkling, refreshing taste",
    icon: "✨",
    popular: false,
    category: "sparkling"
  },
  { 
    id: 4, 
    name: "Alkaline Water 5L", 
    price: 5.99, 
    description: "pH balanced alkaline water",
    icon: "⚡",
    popular: false,
    category: "premium"
  },
  { 
    id: 5, 
    name: "Office Pack 20L", 
    price: 12.99, 
    description: "Bulk supply for offices",
    icon: "🏢",
    popular: true,
    category: "bulk"
  },
  { 
    id: 6, 
    name: "Monthly Plan 50L", 
    price: 29.99, 
    description: "Best value — monthly subscription",
    icon: "📅",
    popular: true,
    category: "subscription"
  },
];

export default function OrderPage() {
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    address: "", 
    phone: "",
    specialInstructions: "",
    deliveryDate: "",
    deliveryTime: "Morning (9AM-12PM)"
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCart, setShowCart] = useState(false);

  function updateCart(id: number, change: number) {
    setCart((prev) => {
      const current = prev[id] || 0;
      const updated = current + change;
      if (updated <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: updated };
    });
  }

  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  async function handleSubmit() {
    if (!form.name || !form.email || !form.address || !form.phone) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (cartItems.length === 0) {
      alert("Your cart is empty. Please add items to continue.");
      return;
    }

    setIsProcessing(true);

    const orderItems = cartItems.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: cart[p.id],
      price: p.price,
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          specialInstructions: form.specialInstructions,
          deliveryDate: form.deliveryDate,
          deliveryTime: form.deliveryTime,
          items: orderItems,
          total: total.toFixed(2),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setOrderId(data.orderId || Math.random().toString(36).substr(2, 9));
      setSubmitted(true);
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4"
      >
        <div className="bg-white rounded-3xl p-10 text-center max-w-md shadow-2xl border border-blue-100">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed! 🎉</h2>
          <p className="text-gray-500 mb-2">Thank you for your order, {form.name}.</p>
          
          <div className="bg-gray-50 rounded-xl p-4 my-6">
            <p className="text-sm text-gray-500 mb-1">Order ID</p>
            <p className="text-lg font-mono font-bold text-blue-600">{orderId}</p>
          </div>
          
          <div className="text-left bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">📦 Delivery Details:</p>
            <p className="text-sm font-medium text-gray-800">{form.address}</p>
            <p className="text-xs text-gray-500 mt-2">
              {form.deliveryDate ? new Date(form.deliveryDate).toLocaleDateString() : "As soon as possible"} • {form.deliveryTime}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
              onClick={() => { 
                setSubmitted(false); 
                setCart({}); 
                setForm({ 
                  name: "", email: "", address: "", phone: "", 
                  specialInstructions: "", deliveryDate: "", deliveryTime: "Morning (9AM-12PM)" 
                }); 
              }}
            >
              Place another order
            </button>
            <Link 
              href="/fullorders" 
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition text-center"
            >
              View all orders
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100/50">
      
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">💧</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              AquaPure
            </span>
          </Link>
          
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-blue-50 hover:bg-blue-100 transition px-4 py-2 rounded-full"
          >
            <span className="text-xl">🛒</span>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🛒</span>
                    <p className="text-gray-400">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((p) => (
                      <div key={p.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="text-3xl">{p.icon}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-sm text-gray-500">R{p.price.toFixed(2)} each</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                              onClick={() => updateCart(p.id, -1)}
                            >-</button>
                            <span className="font-medium">{cart[p.id]}</span>
                            <button
                              className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => updateCart(p.id, 1)}
                            >+</button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">R{(p.price * cart[p.id]).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cartItems.length > 0 && (
                <div className="border-t border-gray-100 p-6">
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">R{total.toFixed(2)}</span>
                  </div>
                  <button
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                    onClick={() => setShowCart(false)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-bold text-gray-800 mb-4"
          >
            Order Fresh Water 💧
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-gray-500 text-lg"
          >
            Pure, clean water delivered to your doorstep
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Products Section */}
          <div className="lg:col-span-2">
            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["all", "still", "sparkling", "premium", "bulk", "subscription"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl group-hover:scale-110 transition">{product.icon}</span>
                    {product.popular && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                        🌟 Popular
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-bold text-blue-600">R{product.price.toFixed(2)}</span>
                    <div className="flex items-center gap-3">
                      <button
                        className="w-10 h-10 rounded-full border-2 border-blue-200 text-blue-600 font-bold text-xl hover:bg-blue-50 transition"
                        onClick={() => updateCart(product.id, -1)}
                      >−</button>
                      <span className="w-8 text-center font-semibold text-gray-700">
                        {cart[product.id] || 0}
                      </span>
                      <button
                        className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                        onClick={() => updateCart(product.id, 1)}
                      >+</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <h2 className="text-xl font-bold mb-1">Checkout</h2>
                <p className="text-blue-100 text-sm">Complete your order details</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Cart Summary Mini */}
                {itemCount > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Items ({itemCount})</span>
                      <span className="font-semibold">R{total.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setShowCart(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View cart details →
                    </button>
                  </div>
                )}
                
                {/* Form Fields */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full name *"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition text-black"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email *"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-black"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-black"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  
                  <textarea
                    placeholder="Delivery address *"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none text-black"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-black"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                    />
                    <select
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-black"
                      value={form.deliveryTime}
                      onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                    >
                      <option>Morning (9AM-12PM)</option>
                      <option>Afternoon (12PM-3PM)</option>
                      <option>Evening (3PM-6PM)</option>
                    </select>
                  </div>
                  
                  <textarea
                    placeholder="Special instructions (optional)"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none text-black"
                    value={form.specialInstructions}
                    onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
                  />
                </div>
                
                {/* Submit Button */}
                <button
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                    itemCount === 0 || isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                  onClick={handleSubmit}
                  disabled={itemCount === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Confirm Order • R${total.toFixed(2)}`
                  )}
                </button>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                  By confirming, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}