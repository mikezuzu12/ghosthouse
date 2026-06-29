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

    const user = session.user as any;
    const userId = Number(user.id);

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "20");

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const unreadCount = (data || []).filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: data || [],
      unreadCount,
    });

  } catch (err) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = Number(user.id);
    const body = await req.json();

    if (body.mark_all) {
      // Mark all notifications as read for this user
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.notification_id) {
      // Mark single notification as read
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("id", body.notification_id)
        .eq("user_id", userId); // ensure user can only mark their own

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  } catch (err) {
    console.error("Notifications PATCH error:", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}