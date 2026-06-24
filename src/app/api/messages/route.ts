import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 MESSAGE API CALLED");
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { order_id, message } = await req.json();

    if (!order_id || !message) {
      return NextResponse.json(
        { error: "order_id and message are required" },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const senderId = Number(user.id);
    const senderName = user.name || (user.role === "driver" ? "Driver" : "Customer");
    const senderRole = user.role || "customer";

    console.log("📤 Sending message:", { order_id, senderId, senderRole });

    // Insert the message
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          order_id,
          sender_id: senderId,
          sender_name: senderName,
          sender_role: senderRole,
          message,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Message inserted");

    // ── CREATE NOTIFICATION FOR RECIPIENT ──
    try {
      // Get the order details - using actual column names from your orders table
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("customer_name, customer_email, driver_id")  // ← Using correct column names
        .eq("id", order_id)
        .single();

      if (orderError) {
        console.error("❌ Order error:", orderError);
      } else {
        console.log("📦 Order data:", orderData);
        
        let recipientId = null;
        let recipientRole = null;

        if (senderRole === "driver") {
          // If sender is driver, recipient is the customer
          // Find the customer's user ID from the users table using their email
          console.log("🔍 Looking for customer with email:", orderData.customer_email);
          
          const { data: customerData, error: customerError } = await supabase
            .from("users")
            .select("id")
            .eq("email", orderData.customer_email)
            .single();

          if (customerError) {
            console.error("❌ Error finding customer by email:", customerError);
            
            // Try finding by name as fallback
            console.log("🔍 Trying to find customer by name:", orderData.customer_name);
            const { data: nameData, error: nameError } = await supabase
              .from("users")
              .select("id")
              .eq("full_name", orderData.customer_name)
              .single();
            
            if (nameError) {
              console.error("❌ Error finding customer by name:", nameError);
            } else if (nameData) {
              recipientId = nameData.id;
              recipientRole = "customer";
              console.log("✅ Found customer by name:", recipientId);
            }
          } else if (customerData) {
            recipientId = customerData.id;
            recipientRole = "customer";
            console.log("✅ Found customer by email:", recipientId);
          }
        } else {
          // If sender is customer, recipient is the driver
          recipientId = orderData.driver_id;
          recipientRole = "driver";
          console.log("👤 Driver ID from order:", recipientId);
        }

        console.log(`👤 Recipient: ID=${recipientId}, Role=${recipientRole}`);

        // Create notification for recipient
        if (recipientId) {
          const notificationMessage = `💬 New message from ${senderName}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`;
          
          console.log("📨 Creating notification for:", { recipientId, recipientRole });
          
          const { data: notifData, error: notifError } = await supabase
            .from("notifications")
            .insert([
              {
                user_id: recipientId,
                user_role: recipientRole,
                order_id: order_id,
                type: "message",
                message: notificationMessage,
                read: false,
                created_at: new Date().toISOString(),
                metadata: {
                  sender_id: senderId,
                  sender_name: senderName,
                  sender_role: senderRole,
                  message_id: data.id,
                }
              }
            ])
            .select();

          if (notifError) {
            console.error("❌ Notification error:", notifError);
          } else {
            console.log("✅ Notification created:", notifData);
          }
        } else {
          console.log("⚠️ No recipient found!");
          
          // Fallback: Create notification for user 4 (your test user)
          console.log("🔄 Creating fallback notification for user 4");
          const { data: fallbackNotif, error: fallbackError } = await supabase
            .from("notifications")
            .insert([
              {
                user_id: 4,
                user_role: "customer",
                order_id: order_id,
                type: "message",
                message: `💬 New message from ${senderName}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                read: false,
                created_at: new Date().toISOString(),
                metadata: {
                  sender_id: senderId,
                  sender_name: senderName,
                  sender_role: senderRole,
                  message_id: data.id,
                  note: "Fallback notification - no recipient found"
                }
              }
            ])
            .select();

          if (fallbackError) {
            console.error("❌ Fallback notification error:", fallbackError);
          } else {
            console.log("✅ Fallback notification created:", fallbackNotif);
          }
        }
      }
    } catch (notifError) {
      console.error("❌ Notification error:", notifError);
    }

    return NextResponse.json({ success: true, message: data });

  } catch (error) {
    console.error("❌ Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}