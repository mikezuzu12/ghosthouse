"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

type Location = {
  id: string;
  driver_id: number;
  driver_name: string;
  order_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: "active" | "idle" | "offline";
  updated_at: string;
};

type Props = {
  orderId: string;
  driverLocation?: Location;
  customerAddress?: string;
  isDriver?: boolean;
};

export default function LiveMap({
  orderId,
  driverLocation,
  customerAddress,
  isDriver = false,
}: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);

  // Load Leaflet CSS + fix icons on client only
  useEffect(() => {
    // ✅ Inject CSS via a <link> tag — safe with Turbopack
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((leaflet) => {
      // Fix missing marker icons
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      setL(leaflet);
    });

    setIsMounted(true);
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!isMounted) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Location error:", error);
          setUserLocation([-29.8587, 31.0218]); // Default: Durban, SA
        }
      );
    } else {
      setUserLocation([-29.8587, 31.0218]);
    }
  }, [isMounted]);

  // Calculate route between driver and customer
  const calculateRoute = async () => {
    if (!driverLocation || !userLocation) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${driverLocation.longitude},${driverLocation.latitude};${userLocation[1]},${userLocation[0]}?overview=full&geometries=geojson`
      );
      if (!res.ok) throw new Error("Route fetch failed");
      const data = await res.json();
      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );
        setRoute(coords);
      }
    } catch (err) {
      console.error("Failed to calculate route:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverLocation && userLocation && isMounted) {
      calculateRoute();
    }
  }, [driverLocation, userLocation, isMounted]);

  // Re-center map when driver moves
  useEffect(() => {
    if (mapRef.current && isMounted) {
      const center = driverLocation
        ? ([driverLocation.latitude, driverLocation.longitude] as [number, number])
        : userLocation ?? ([-29.8587, 31.0218] as [number, number]);
      mapRef.current.setView(center, 13);
    }
  }, [driverLocation, userLocation, isMounted]);

  if (!isMounted || !userLocation || !L) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-xl border border-gray-700">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">🔄</div>
          <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer
        ref={mapRef}
        center={userLocation}
        zoom={13}
        className="h-[300px] rounded-xl border border-blue-900"
        style={{ width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver marker */}
        {driverLocation && (
          <Marker position={[driverLocation.latitude, driverLocation.longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-900">
                  🚚 {driverLocation.driver_name}
                </p>
                <p className="text-xs text-gray-500">Status: {driverLocation.status}</p>
                <p className="text-xs text-gray-500">
                  Updated: {new Date(driverLocation.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer / user marker */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-900">📍 Your Location</p>
                {customerAddress && (
                  <p className="text-xs text-gray-500">{customerAddress}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline */}
        {route.length > 0 && (
          <Polyline
            positions={route}
            color="#378ADD"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>🚚</span>
            <span className="text-gray-600 font-medium">Driver</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span className="text-gray-600 font-medium">You</span>
          </div>
          {route.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 border-t-2 border-dashed border-blue-500" />
              <span className="text-gray-600 font-medium">Route</span>
            </div>
          )}
        </div>
      </div>

      {/* Route loading indicator */}
      {loading && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs text-gray-600 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin text-sm">🔄</div>
            Calculating route...
          </div>
        </div>
      )}
    </div>
  );
}