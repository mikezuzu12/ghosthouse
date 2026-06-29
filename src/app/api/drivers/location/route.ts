import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Service role key — only ever used here, server-side. Never import this
// client from a "use client" component.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Driver app calls this on every GPS tick (via DriverLocationTracker.tsx)
export async function POST(req: Request) {
  const body = await req.json();
  const { driver_id, driver_name, order_id, latitude, longitude, accuracy, status } = body;

  if (!order_id || !driver_id || latitude == null || longitude == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("driver_locations")
    .upsert(
      {
        driver_id,
        driver_name,
        order_id,
        latitude,
        longitude,
        accuracy,
        status: status ?? "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_id" } // one row per order — new ping overwrites the old one
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}

// Driver's own dashboard polls this to show their own current location back to them
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "order_id is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("driver_locations")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}