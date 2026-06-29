import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ messages: data || [] });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { order_id, message } = await req.json();
    if (!order_id || !message) {
      return NextResponse.json({ error: "order_id and message are required" }, { status: 400 });
    }

    const user = session.user as any;
    const senderId = Number(user.id);
    const senderName = user.name || "User";
    const senderRole = user.role || "Customer";

    // Insert the message
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert([{
        order_id,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        message,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ✅ Create notification for the recipient
    try {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("customer_email, driver_id")
        .eq("id", order_id)
        .single();

      if (order) {
        let recipientId: number | null = null;
        let recipientRole: string | null = null;

        if (senderRole === "Driver") {
          // Driver sent message → notify customer
          const { data: customer } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", order.customer_email)
            .maybeSingle();

          if (customer) {
            recipientId = customer.id;
            recipientRole = "Customer";
          }
        } else {
          // Customer sent message → notify driver
          if (order.driver_id) {
            recipientId = Number(order.driver_id);
            recipientRole = "Driver";
          }
        }

        if (recipientId && recipientRole) {
          const preview = message.length > 50 ? message.substring(0, 50) + "..." : message;

          await supabaseAdmin.from("notifications").insert([{
            user_id: recipientId,
            user_role: recipientRole,
            order_id,
            type: "message",
            message: `💬 New message from ${senderName}: "${preview}"`,
            read: false,
            created_at: new Date().toISOString(),
            metadata: {
              sender_id: senderId,
              sender_name: senderName,
              sender_role: senderRole,
              message_id: data.id,
            },
          }]);

          console.log(`✅ Notification sent to ${recipientRole} (ID: ${recipientId})`);
        } else {
          console.warn("⚠️ Could not find recipient for notification");
        }
      }
    } catch (notifErr) {
      // Don't fail message send if notification fails
      console.error("Notification error:", notifErr);
    }

    return NextResponse.json({ success: true, message: data });

  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}