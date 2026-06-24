import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, address, items, total, specialInstructions, deliveryDate, deliveryTime } = body;

    if (!name || !email || !address || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([{
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        delivery_address: address,
        items,
        total: parseFloat(total),
        special_instructions: specialInstructions,
        delivery_date: deliveryDate || null,
        delivery_time: deliveryTime,
        delivery_status: "unclaimed",
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });

  } catch (err) {
    console.error("Order POST error:", err);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}