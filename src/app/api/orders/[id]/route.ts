import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const user = session.user as any;
    const userRole = user.role;
    const userId = user.id;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Security: customers can only view their own orders
    if (userRole === "Customer" && order.customer_email !== user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Security: drivers can only view orders assigned to them or unclaimed ones
    if (userRole === "Driver" && order.driver_id && String(order.driver_id) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order });

  } catch (err) {
    console.error("Order GET error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}