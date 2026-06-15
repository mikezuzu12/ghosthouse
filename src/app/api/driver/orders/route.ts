import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "available";

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

    // Fixed stats queries
    const [{ count: available }, { count: claimed }, { count: delivered }] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "unclaimed"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "claimed"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("delivery_status", "delivered"),
    ]);

    return NextResponse.json({
      orders: orders || [],
      stats: {
        available: available ?? 0,
        claimed: claimed ?? 0,
        delivered: delivered ?? 0,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}