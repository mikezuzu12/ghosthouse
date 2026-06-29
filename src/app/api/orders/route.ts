import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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

    // Place the order
    const { data, error } = await supabaseAdmin
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

    // ✅ Notify all active drivers about the new order
    try {
      const { data: drivers } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "Driver")
        .eq("is_blocked", false);

      if (drivers && drivers.length > 0) {
        const notifications = drivers.map((driver) => ({
          user_id: driver.id,
          user_role: "Driver",
          order_id: data.id,
          type: "order_created",
          message: `🛒 New order available from ${name} — R${parseFloat(total).toFixed(2)}. Delivery to: ${address}`,
          read: false,
          created_at: new Date().toISOString(),
          metadata: {
            customer_name: name,
            total,
            address,
          },
        }));

        const { error: notifError } = await supabaseAdmin
          .from("notifications")
          .insert(notifications);

        if (notifError) {
          console.error("Failed to create driver notifications:", notifError);
        } else {
          console.log(`✅ Notified ${drivers.length} drivers about new order`);
        }
      }
    } catch (notifErr) {
      // Don't fail the order if notifications fail
      console.error("Notification error:", notifErr);
    }

    return NextResponse.json({ success: true, order: data });

  } catch (err) {
    console.error("Order POST error:", err);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}