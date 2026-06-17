import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "available";

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const driverId = session.user.id;

  const statusMap: Record<string, string> = {
    available: "unclaimed",
    claimed: "claimed",
    delivered: "delivered",
  };

  const deliveryStatus = statusMap[status] || "unclaimed";

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status === "available") {
    query = query.eq("delivery_status", "unclaimed");
  } else {
    query = query
      .eq("delivery_status", deliveryStatus)
      .eq("driver_id", driverId);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const [available, claimed, delivered] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "unclaimed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "claimed").eq("driver_id", driverId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "delivered").eq("driver_id", driverId),
  ]);

  const { data: deliveredOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("delivery_status", "delivered")
    .eq("driver_id", driverId);

  const totalEarnings = deliveredOrders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  return NextResponse.json({
    orders,
    stats: {
      available: available.count ?? 0,
      claimed: claimed.count ?? 0,
      delivered: delivered.count ?? 0,
      totalEarnings: totalEarnings.toFixed(2),
    },
  });
}