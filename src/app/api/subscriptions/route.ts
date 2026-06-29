import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { plan_id, plan_name, billing_cycle, addons, delivery_address, start_date, monthly_price, order } = body;

    // Save subscription
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert([{
        user_id: Number(user.id),
        customer_email: user.email,
        plan_id,
        plan_name,
        billing_cycle,
        addons,
        delivery_address,
        start_date,
        monthly_price,
        status: "active",
        created_at: new Date().toISOString(),
      }]);

    if (subError) {
      console.error("Subscription insert error:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // Create the first order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([{
        customer_name: order.name,
        customer_email: order.email,
        customer_phone: order.phone || "",
        delivery_address: order.address,
        items: order.items,
        total: order.total,
        special_instructions: order.specialInstructions,
        delivery_date: order.deliveryDate || null,
        delivery_status: "unclaimed",
      }])
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Notify all drivers
    const { data: drivers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "Driver")
      .eq("is_blocked", false);

    if (drivers && drivers.length > 0) {
      await supabaseAdmin.from("notifications").insert(
        drivers.map((d) => ({
          user_id: d.id,
          user_role: "Driver",
          order_id: orderData.id,
          type: "order_created",
          message: `🛒 New subscription order — ${plan_name} Plan. Delivery to: ${delivery_address}`,
          read: false,
          created_at: new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({ success: true, order: orderData });

  } catch (err) {
    console.error("Subscription POST error:", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}