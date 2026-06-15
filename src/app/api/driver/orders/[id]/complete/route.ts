import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../../lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("orders")
    .update({
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("delivery_status", "claimed");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}