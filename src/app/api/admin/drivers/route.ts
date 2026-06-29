import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const supabase = supabaseAdmin;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch Driver AND Inactive (previously deactivated) users
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone, created_at, role, is_blocked")
    .in("role", ["Driver", "Inactive"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const driversWithStats = await Promise.all(
    (data || []).map(async (driver) => {
      const { count: totalDeliveries } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driver.id)
        .eq("delivery_status", "delivered");

      const { count: activeOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driver.id)
        .eq("delivery_status", "claimed");

      return {
        ...driver,
        totalDeliveries: totalDeliveries ?? 0,
        activeOrders: activeOrders ?? 0,
      };
    })
  );

  return NextResponse.json({ drivers: driversWithStats });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await req.json();

  // Block / unblock (keeps role intact)
  if (action === "block" || action === "unblock") {
    const { error } = await supabase
      .from("users")
      .update({ is_blocked: action === "block" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Deactivate / reactivate (changes role)
  if (action === "deactivate") {
    const { error } = await supabase
      .from("users")
      .update({ role: "Inactive" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "activate") {
    const { error } = await supabase
      .from("users")
      .update({ role: "Driver" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}