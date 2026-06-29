import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const MAX_DISTANCE_KM = 60;

// Haversine formula — returns distance in km between two lat/lng points
function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode an address string → { lat, lon } using Nominatim (free, no key needed)
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "User-Agent": "AquaPure/1.0" } }
    );
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is missing" }, { status: 400 });
    }

    const driverId = session.user.id;

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, delivery_status, delivery_address")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
    if (order.delivery_status !== "unclaimed") {
      return NextResponse.json({ error: "Order already claimed by another driver" }, { status: 409 });
    }

    // ✅ 60km radius check
    // Get driver's last known location
    const { data: driverLoc } = await supabase
      .from("driver_locations")
      .select("latitude, longitude, updated_at")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (!driverLoc) {
      return NextResponse.json(
        { error: "Your location is not available. Please enable location tracking before claiming an order." },
        { status: 403 }
      );
    }

    // Check location is fresh (within last 5 minutes)
    const locationAge = Date.now() - new Date(driverLoc.updated_at).getTime();
    if (locationAge > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Your location is outdated. Please start tracking to refresh your location." },
        { status: 403 }
      );
    }

    // Geocode the delivery address
    const orderCoords = await geocodeAddress(order.delivery_address);
    if (!orderCoords) {
      // If geocoding fails, allow the claim (don't block driver due to geocoding issues)
      console.warn(`Could not geocode address: ${order.delivery_address} — skipping distance check`);
    } else {
      const distanceKm = getDistanceKm(
        driverLoc.latitude,
        driverLoc.longitude,
        orderCoords.lat,
        orderCoords.lon
      );

      console.log(`Driver distance to order: ${distanceKm.toFixed(1)}km`);

      if (distanceKm > MAX_DISTANCE_KM) {
        return NextResponse.json(
          {
            error: `You are ${distanceKm.toFixed(1)}km away from the delivery address. Only drivers within ${MAX_DISTANCE_KM}km can claim this order.`,
          },
          { status: 403 }
        );
      }
    }

    // Claim the order
    const { data, error } = await supabase
      .from("orders")
      .update({
        delivery_status: "claimed",
        driver_id: driverId,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("delivery_status", "unclaimed")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("Claim error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}