import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params; // ← await params in Next.js 15

    console.log("SESSION USER:", session?.user);
    console.log("ORDER ID:", orderId);

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is missing" }, { status: 400 });
    }

    const driverId = session.user.id;

    // Check order exists and is unclaimed
    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("id, delivery_status")
      .eq("id", orderId)
      .maybeSingle();

    console.log("FOUND ORDER:", existing);
    console.log("FETCH ERROR:", fetchError);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json(
        { error: `Order ${orderId} not found in database` },
        { status: 404 }
      );
    }

    if (existing.delivery_status !== "unclaimed") {
      return NextResponse.json(
        { error: "Order already claimed by another driver" },
        { status: 409 }
      );
    }

    // Claim the order
    const { data, error } = await supabase
      .from("orders")
      .update({
        delivery_status: "claimed",
        driver_id: driverId,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("delivery_status", "unclaimed")
      .select()
      .single();

    if (error) {
      console.error("Claim update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("ORDER CLAIMED SUCCESSFULLY:", data);

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("Claim error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}