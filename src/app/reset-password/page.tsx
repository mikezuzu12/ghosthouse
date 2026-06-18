"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  async function handleReset() {
    setError("");

    if (!form.password || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✅
        </div>
        <h2 className="text-2xl font-bold text-[#042C53] mb-2">Password updated!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Your password has been reset. Redirecting to login...
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-[#185FA5] text-white rounded-full text-sm hover:bg-[#042C53] transition"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E6F1FB] rounded-2xl mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-[#042C53]">Create new password</h1>
        <p className="text-gray-400 text-sm mt-2">
          Your new password must be at least 6 characters.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm px-4 py-3 rounded-lg mb-5 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            New password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔒</span>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#185FA5] transition text-black"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Confirm new password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔒</span>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#185FA5] transition text-black"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
          </div>
        </div>

        {/* Password strength indicator */}
        {form.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    form.password.length >= level * 3
                      ? level <= 1 ? "bg-red-400"
                        : level <= 2 ? "bg-orange-400"
                        : level <= 3 ? "bg-yellow-400"
                        : "bg-green-400"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {form.password.length < 3 ? "Too short"
                : form.password.length < 6 ? "Weak"
                : form.password.length < 9 ? "Fair"
                : form.password.length < 12 ? "Good"
                : "Strong"} password
            </p>
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading || !token}
          className="w-full py-3 bg-[#185FA5] text-white rounded-full font-semibold text-sm hover:bg-[#042C53] transition disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Updating...
            </span>
          ) : (
            "Update password →"
          )}
        </button>

        <Link
          href="/login"
          className="block text-center text-sm text-gray-400 hover:text-[#185FA5] transition"
        >
          ← Back to login
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#E6F1FB] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#B5D4F4] shadow-sm w-full max-w-md p-8"
      >
        <Suspense fallback={<p className="text-center text-gray-400">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}