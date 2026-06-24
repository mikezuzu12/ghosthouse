import { NextResponse } from "next/server";

export async function GET() {
  console.log("🔔 Notifications API called - MINIMAL VERSION");
  
  // Return simple test data
  return NextResponse.json({
    notifications: [
      {
        id: "test-1",
        user_id: 4,
        user_role: "customer",
        type: "test",
        message: "🧪 Test notification!",
        read: false,
        created_at: new Date().toISOString(),
      }
    ],
    unreadCount: 1
  });
}

export async function PATCH() {
  console.log("🔔 PATCH called");
  return NextResponse.json({ success: true });
}