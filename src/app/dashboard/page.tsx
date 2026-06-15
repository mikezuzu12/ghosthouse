"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-blue-100 p-10 text-center max-w-md w-full shadow-sm">
        <span className="text-4xl">💧</span>

        <h1 className="text-2xl font-bold text-blue-900 mt-3">
          Welcome back, {user?.name ?? "User"}!
        </h1>

        <p className="text-gray-400 mt-1 text-sm">
          You are logged in 🎉
        </p>

        <p className="text-xs text-blue-400 mt-1">
          Role: {user?.role}
        </p>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/orders"
            className="bg-[#378ADD] text-white px-8 py-3 rounded-full text-sm hover:bg-[#185FA5] transition"
          >
            Full Orders
          </Link>

          <button
            className="px-5 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}