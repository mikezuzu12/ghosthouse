import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "available";

  // Map tab name to actual delivery_status value in database
  const statusMap: Record<string, string> = {
    available: "unclaimed",
    claimed: "claimed",
    delivered: "delivered",
  };

  const deliveryStatus = statusMap[status] || "unclaimed";

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("delivery_status", deliveryStatus)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get counts for all statuses for the stats bar
  const [available, claimed, delivered] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("delivery_status", "unclaimed"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("delivery_status", "claimed"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("delivery_status", "delivered"),
  ]);

  return NextResponse.json({
    orders,
    stats: {
      available: available.count ?? 0,
      claimed: claimed.count ?? 0,
      delivered: delivered.count ?? 0,
    },
  });
}