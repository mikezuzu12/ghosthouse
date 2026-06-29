"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    icon: "💧",
    price: 299,
    priceRange: "R260 – R400",
    color: "from-blue-600 to-blue-700",
    border: "border-blue-500/30",
    highlight: "border-blue-500",
    badge: null,
    includes: [
      "Dispenser rental included",
      "100L monthly water allowance",
      "Free delivery",
      "Monthly billing",
    ],
    extras: "Extra bottles at R47–R65 each",
    bottles: 5,
    litres: 100,
  },
  {
    id: "midtier",
    name: "Mid-Tier",
    icon: "🏆",
    price: 590,
    priceRange: "~R590/month",
    color: "from-cyan-600 to-blue-600",
    border: "border-cyan-500/30",
    highlight: "border-cyan-400",
    badge: "Most Popular",
    includes: [
      "Premium floor-standing compressor cooler",
      "4 × 20L bottles (80L total)",
      "Free delivery",
      "Priority support",
      "Monthly billing",
    ],
    extras: "Extra bottles at R47–R65 each",
    bottles: 4,
    litres: 80,
  },
  {
    id: "plumbed",
    name: "Plumbed-In",
    icon: "🔧",
    price: 1100,
    priceRange: "R400 – R1,800+",
    color: "from-purple-600 to-purple-700",
    border: "border-purple-500/30",
    highlight: "border-purple-500",
    badge: "Premium",
    includes: [
      "Inline filtration unit installed",
      "Connects to building main supply",
      "No bottle deliveries needed",
      "Machine rental & maintenance",
      "Monthly billing",
    ],
    extras: "Maintenance visits included",
    bottles: 0,
    litres: null,
  },
];

const ADDONS = [
  { id: "extra_bottle", label: "Extra 20L bottle", price: 55, icon: "🫙" },
  { id: "extra_dispenser", label: "Additional dispenser unit", price: 150, icon: "🚰" },
  { id: "priority_delivery", label: "Priority same-day delivery", price: 80, icon: "⚡" },
];

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [step, setStep] = useState<"choose" | "confirm" | "success">("choose");
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const user = session?.user as any;

  const plan = PLANS.find((p) => p.id === selectedPlan);
  const discount = billingCycle === "annual" ? 0.1 : 0;

  const addonTotal = selectedAddons.reduce((sum, id) => {
    const addon = ADDONS.find((a) => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const basePrice = plan ? Math.round(plan.price * (1 - discount)) : 0;
  const totalPrice = basePrice + addonTotal;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubscribe = async () => {
    if (!plan || !deliveryAddress) return;
    setLoading(true);

    try {
      const items = [
        {
          name: `${plan.name} Water Subscription`,
          quantity: 1,
          price: basePrice,
        },
        ...selectedAddons.map((id) => {
          const addon = ADDONS.find((a) => a.id === id)!;
          return { name: addon.label, quantity: 1, price: addon.price };
        }),
      ];

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          plan_name: plan.name,
          billing_cycle: billingCycle,
          addons: selectedAddons,
          delivery_address: deliveryAddress,
          start_date: deliveryDate || new Date().toISOString().split("T")[0],
          monthly_price: totalPrice,
          // Also create a first order
          order: {
            name: user?.name,
            email: user?.email,
            phone: user?.phone || "",
            address: deliveryAddress,
            items,
            total: totalPrice,
            specialInstructions: `Subscription: ${plan.name} plan (${billingCycle})`,
            deliveryDate,
          },
        }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#0A0E1A", color: "#F0F4FF" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl" style={{ background: "rgba(10,14,26,0.85)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
              💧
            </div>
            <span className="font-bold text-white text-sm">AquaPure</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        <AnimatePresence mode="wait">

          {/* ── STEP 1: CHOOSE PLAN ── */}
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
                >
                  💧
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Choose your water plan
                </h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                  Clean, fresh water delivered to your door every month. Cancel anytime.
                </p>
              </div>

              {/* Billing toggle */}
              <div className="flex justify-center mb-8">
                <div className="flex gap-1 p-1 rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {(["monthly", "annual"] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${
                        billingCycle === cycle ? "text-white" : "text-slate-400 hover:text-white"
                      }`}
                      style={billingCycle === cycle ? { background: "linear-gradient(135deg,#3B82F6,#06B6D4)" } : {}}
                    >
                      {cycle}
                      {cycle === "annual" && (
                        <span className="ml-2 text-xs text-emerald-400 font-semibold">Save 10%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {PLANS.map((p, i) => {
                  const discountedPrice = Math.round(p.price * (1 - discount));
                  const isSelected = selectedPlan === p.id;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                        isSelected ? p.highlight : "border-white/8 hover:border-white/20"
                      }`}
                      style={{ background: isSelected ? "rgba(59,130,246,0.05)" : "#111827" }}
                    >
                      {p.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                            {p.badge}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{p.icon}</span>
                          <h3 className="font-bold text-white text-lg">{p.name}</h3>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? "border-blue-400 bg-blue-400" : "border-white/20"
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold text-white">R{discountedPrice}</span>
                          <span className="text-slate-400 text-sm mb-1">/month</span>
                        </div>
                        {billingCycle === "annual" && (
                          <p className="text-xs text-slate-500 line-through">R{p.price}/month</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Market range: {p.priceRange}</p>
                      </div>

                      {p.litres && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.08)" }}>
                          <span className="text-2xl">🫙</span>
                          <div>
                            <p className="text-white font-semibold text-sm">{p.litres}L / month</p>
                            {p.bottles > 0 && (
                              <p className="text-slate-400 text-xs">{p.bottles} × 20L bottles</p>
                            )}
                          </div>
                        </div>
                      )}

                      <ul className="space-y-2 mb-4">
                        {p.includes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>

                      <p className="text-xs text-slate-500 border-t border-white/5 pt-3">
                        {p.extras}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add-ons */}
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/8 p-6 mb-8"
                  style={{ background: "#111827" }}
                >
                  <h3 className="font-semibold text-white mb-4">🛒 Optional Add-ons</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ADDONS.map((addon) => {
                      const isSelected = selectedAddons.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                            isSelected
                              ? "border-blue-500/50 bg-blue-500/10"
                              : "border-white/8 hover:border-white/20"
                          }`}
                          style={{ background: isSelected ? undefined : "rgba(255,255,255,0.02)" }}
                        >
                          <span className="text-2xl">{addon.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{addon.label}</p>
                            <p className="text-xs text-slate-400">+R{addon.price}/month</p>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? "bg-blue-500 border-blue-500" : "border-white/20"
                          }`}>
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* CTA */}
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/8 p-5"
                  style={{ background: "#111827" }}
                >
                  <div>
                    <p className="text-slate-400 text-sm">Selected: <span className="text-white font-semibold">{plan?.name} Plan</span></p>
                    <p className="text-2xl font-bold text-white">
                      R{totalPrice}<span className="text-slate-400 text-sm font-normal">/month</span>
                    </p>
                    {billingCycle === "annual" && (
                      <p className="text-xs text-emerald-400">You save R{Math.round((plan?.price || 0) * 0.1 * 12)}/year</p>
                    )}
                  </div>
                  <button
                    onClick={() => setStep("confirm")}
                    className="px-8 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
                  >
                    Continue →
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: CONFIRM ── */}
          {step === "confirm" && plan && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <button
                onClick={() => setStep("choose")}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to plans
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Confirm your subscription</h2>

              {/* Order summary */}
              <div className="rounded-2xl border border-white/8 p-5 mb-5" style={{ background: "#111827" }}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{plan.name} Plan ({billingCycle})</span>
                    <span className="text-white font-medium">R{basePrice}/mo</span>
                  </div>
                  {selectedAddons.map((id) => {
                    const addon = ADDONS.find((a) => a.id === id)!;
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-slate-300">{addon.label}</span>
                        <span className="text-white font-medium">R{addon.price}/mo</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-white/8 pt-3 flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-xl text-white">R{totalPrice}/month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <p className="text-xs text-emerald-400 text-right">
                      Billed as R{totalPrice * 12}/year — saving R{Math.round((plan.price - basePrice) * 12)}/year
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery details */}
              <div className="rounded-2xl border border-white/8 p-5 mb-6" style={{ background: "#111827" }}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Delivery Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      placeholder="Enter your delivery address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm outline-none focus:border-blue-500 transition"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preferred Start Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm outline-none focus:border-blue-500 transition"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading || !deliveryAddress}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition disabled:opacity-50 hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Subscribe for R${totalPrice}/month →`
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-3">
                Cancel anytime. No lock-in contracts.
              </p>
            </motion.div>
          )}

          {/* ── STEP 3: SUCCESS ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
                style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
              >
                ✅
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-3">You're subscribed!</h2>
              <p className="text-slate-400 mb-2">
                Your <span className="text-white font-semibold">{plan?.name} Plan</span> is now active.
              </p>
              <p className="text-slate-400 mb-8">
                Your first delivery will be scheduled and a driver will be assigned shortly.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => router.push("/orders")}
                  className="w-full py-3 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/20 transition"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  View my orders
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}