import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [orders, drivers, customers, revenue] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "Driver"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "Customer"),
    supabase.from("orders").select("total"),
  ]);

  const [unclaimed, claimed, delivered] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "unclaimed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "claimed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "delivered"),
  ]);

  const totalRevenue = revenue.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  // Orders per day for last 7 days
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("created_at, total")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    stats: {
      totalOrders: orders.count ?? 0,
      totalDrivers: drivers.count ?? 0,
      totalCustomers: customers.count ?? 0,
      totalRevenue: totalRevenue.toFixed(2),
      unclaimed: unclaimed.count ?? 0,
      claimed: claimed.count ?? 0,
      delivered: delivered.count ?? 0,
    },
    recentOrders: recentOrders || [],
  });
}