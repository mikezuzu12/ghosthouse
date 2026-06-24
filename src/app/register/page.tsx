"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [role, setRole] = useState("Customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Only redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      const userRole = (session.user as any)?.role?.toLowerCase();
      if (userRole === "driver") router.push("/driver/dashboard");
      else router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Don't render form if already authenticated (will redirect)
  if (status === "authenticated") return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
          role: role.toLowerCase(),
          address: role === "Customer" ? address : null,
          license_number: role === "Driver" ? licenseNumber : null,
          vehicle_type: role === "Driver" ? vehicleType : null,
          vehicle_registration: role === "Driver" ? vehicleReg : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0A0E1A" }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>💧</div>
          <span className="text-xl font-bold text-white tracking-tight">AquaPure</span>
        </div>

        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/8"
            style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(6,182,212,0.05) 100%)" }}>
            <h1 className="text-lg font-bold text-white">Create your account</h1>
            <p className="text-slate-400 text-sm mt-0.5">Join AquaPure and get water delivered</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  <span>⚠️</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Role toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Customer", "Driver"].map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                      role === r ? "text-white shadow-md" : "text-slate-500 hover:text-slate-300"
                    }`}
                    style={role === r ? { background: "linear-gradient(135deg,#3B82F6,#06B6D4)" } : {}}>
                    {r === "Customer" ? "👤 " : "🚚 "}{r}
                  </button>
                ))}
              </div>

              {/* Full name */}
              <Field label="Full Name">
                <input type="text" placeholder="John Smith" required
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  value={fullName} onChange={e => setFullName(e.target.value)} />
              </Field>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <input type="email" placeholder="you@email.com" required
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input type="tel" placeholder="+27 ..." required
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </Field>
              </div>

              {/* Customer address */}
              <AnimatePresence>
                {role === "Customer" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Field label="Delivery Address">
                      <textarea placeholder="123 Main St, City" rows={2} required
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none resize-none transition"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                        value={address} onChange={e => setAddress(e.target.value)} />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Driver fields */}
              <AnimatePresence>
                {role === "Driver" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="space-y-3">
                    <Field label="License Number">
                      <input type="text" placeholder="DL-12345" required
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                        value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Vehicle Type">
                        <input type="text" placeholder="Bakkie / Van" required
                          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          value={vehicleType} onChange={e => setVehicleType(e.target.value)} />
                      </Field>
                      <Field label="Registration">
                        <input type="text" placeholder="CA 123-456" required
                          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password">
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" required minLength={6}
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition pr-10"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                      value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-xs">
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm">
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} placeholder="Repeat password" required
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-white/8 focus:border-blue-500/50 outline-none transition pr-10"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-xs">
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 mt-2"
                style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : `Create ${role} Account`}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 pt-1">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold transition" style={{ color: "#06B6D4" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Small label wrapper ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}