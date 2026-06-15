"use client";

import Link from "next/link";
import { useState } from "react";

const products = [
  { id: 1, name: "Still Water 5L", price: 3.99, description: "Pure still water, perfect for home use" },
  { id: 2, name: "Still Water 10L", price: 6.99, description: "Large still water for families" },
  { id: 3, name: "Sparkling Water 5L", price: 4.99, description: "Lightly sparkling, refreshing taste" },
  { id: 4, name: "Alkaline Water 5L", price: 5.99, description: "pH balanced alkaline water" },
  { id: 5, name: "Office Pack 20L", price: 12.99, description: "Bulk supply for offices" },
  { id: 6, name: "Monthly Plan 50L", price: 29.99, description: "Best value — monthly subscription" },
];

export default function OrderPage() {
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "", phone: "" });

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

  async function handleSubmit() {
  if (!form.name || !form.email || !form.address)
    return alert("Please fill in all fields.");
  if (cartItems.length === 0)
    return alert("Your cart is empty.");

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
        items: orderItems,
        total: total.toFixed(2),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setSubmitted(true);
  } catch (err) {
    alert("Something went wrong. Please try again.");
    console.error(err);
  }
}

  if (submitted) {
    return (
      
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border border-blue-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Order placed!</h2>
          <p className="text-gray-500 mb-1">Thank you, {form.name}.</p>
          <p className="text-gray-500 mb-6">We'll deliver to <span className="font-medium text-gray-700">{form.address}</span> soon.</p>
          <p className="text-xl font-bold text-blue-700 mb-6">Total: ${total.toFixed(2)}</p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm"
            onClick={() => { setSubmitted(false); setCart({}); setForm({ name: "", email: "", address: "", phone: "" }); }}
          >
            Place another order
          </button>
          <Link href="/fullorders" className="bg-[#378ADD] text-white px-8 py-3 rounded-full text-sm hover:bg-[#185FA5] transition">
          Orders list
        </Link>
        </div>
      </div>
      
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-blue-100 px-6 py-4 flex items-center justify-between">
        <span className="text-blue-700 font-bold text-xl">💧 AquaPure</span>
        <span className="text-sm text-gray-500">
          {itemCount > 0 && (
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              {itemCount} item{itemCount > 1 ? "s" : ""} in cart
            </span>
          )}
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Place your order</h1>
        <p className="text-gray-500 mb-8">Select your water products and fill in your delivery details.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Products */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">Choose products</h2>
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-blue-100 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-400">{product.description}</p>
                  <p className="text-blue-600 font-semibold mt-1">R{product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="w-8 h-8 rounded-full border border-blue-200 text-blue-600 font-bold text-lg flex items-center justify-center hover:bg-blue-50"
                    onClick={() => updateCart(product.id, -1)}
                  >−</button>
                  <span className="w-6 text-center font-medium text-gray-700">{cart[product.id] || 0}</span>
                  <button
                    className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center hover:bg-blue-700"
                    onClick={() => updateCart(product.id, 1)}
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary + form */}
          <div className="space-y-6">

            {/* Cart summary */}
            <div className="bg-white rounded-xl border border-blue-100 p-5">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">Order summary</h2>
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-400">No items selected yet.</p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {cartItems.map((p) => (
                    <li key={p.id} className="flex justify-between text-sm text-gray-600">
                      <span>{p.name} × {cart[p.id]}</span>
                      <span>R{(p.price * cart[p.id]).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-blue-50 pt-3 flex justify-between font-semibold text-gray-800">
                <span>Total</span>
                <span className="text-blue-600">R{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery form */}
            <div className="bg-white rounded-xl border border-blue-100 p-5 space-y-3">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Delivery details</h2>
              <input
                type="text"
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <textarea
                placeholder="Delivery address"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <button
                className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold text-sm hover:bg-blue-700 transition"
                onClick={handleSubmit}
              >
                Confirm order →
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}