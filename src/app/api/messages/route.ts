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

    // Get the user from session
    const user = session.user as any;
    const senderId = Number(user.id);
    const senderName = user.name || (user.role === "driver" ? "Driver" : "Customer");
    const senderRole = user.role || "customer";

    console.log("Sending message:", {
      order_id,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      message
    });

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
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Message inserted successfully:", data);

    return NextResponse.json({ success: true, message: data });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}