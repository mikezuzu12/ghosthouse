import { NextRequest, NextResponse } from "next/server";
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
    const { driver_id, driver_name, order_id, latitude, longitude, accuracy, status } = body;

    if (!driver_id || !order_id || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upsert driver location
    const { data, error } = await supabase
      .from("driver_locations")
      .upsert(
        {
          driver_id,
          driver_name,
          order_id,
          latitude,
          longitude,
          accuracy: accuracy || 0,
          status: status || 'active',
          updated_at: new Date().toISOString()
        },
        { onConflict: "driver_id, order_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, location: data });

  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("order_id", orderId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the first result or null
    return NextResponse.json({ location: data?.[0] || null });

  } catch (error) {
    console.error("Get location error:", error);
    return NextResponse.json(
      { error: "Failed to get location" },
      { status: 500 }
    );
  }
}