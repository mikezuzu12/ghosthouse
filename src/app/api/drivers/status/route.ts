import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Called by DriverLocationTracker.tsx when the driver hits "Stop Tracking"
// or closes the page (sets status to idle/offline without touching lat/lng).
export async function POST(req: Request) {
  const { driver_id, order_id, status } = await req.json();

  if (!order_id || !driver_id || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("driver_locations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("order_id", order_id)
    .eq("driver_id", driver_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}