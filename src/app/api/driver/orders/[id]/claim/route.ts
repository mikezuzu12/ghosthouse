import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../../lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        delivery_status: "claimed",
        claimed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("delivery_status", "unclaimed")
      .select()
      .single();

    if (error) {
      console.error("Claim Order Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to claim order" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: "Order not found or it has already been claimed.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order claimed successfully",
      order: data,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}