"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#E6F1FB] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-[#B5D4F4] shadow-sm w-full max-w-md p-8 text-center"
        >
          <div className="w-16 h-16 bg-[#E6F1FB] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            📧
          </div>
          <h2 className="text-2xl font-bold text-[#042C53] mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm mb-2">
            We sent a password reset link to:
          </p>
          <p className="text-[#185FA5] font-semibold mb-6">{email}</p>
          <p className="text-gray-400 text-xs mb-6">
            Didn't receive it? Check your spam folder or try again.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full py-2.5 border border-[#185FA5] text-[#185FA5] rounded-full text-sm hover:bg-[#E6F1FB] transition"
            >
              Try a different email
            </button>
            <Link
              href="/login"
              className="w-full py-2.5 bg-[#185FA5] text-white rounded-full text-sm hover:bg-[#042C53] transition text-center"
            >
              Back to login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6F1FB] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#B5D4F4] shadow-sm w-full max-w-md p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E6F1FB] rounded-2xl mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-[#042C53]">Forgot password?</h1>
          <p className="text-gray-400 text-sm mt-2">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm px-4 py-3 rounded-lg mb-5 flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">📧</span>
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-transparent transition text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-[#185FA5] text-white rounded-full font-semibold text-sm hover:bg-[#042C53] transition disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              "Send reset link →"
            )}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm text-gray-400 hover:text-[#185FA5] transition mt-2"
          >
            ← Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}