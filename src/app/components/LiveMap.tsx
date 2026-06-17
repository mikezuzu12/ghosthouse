"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Import Leaflet CSS only on client
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

type Location = {
  id: string;
  driver_id: number;
  driver_name: string;
  order_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'active' | 'idle' | 'offline';
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
  isDriver = false 
}: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  // Load Leaflet on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet);
        // Fix default marker icons
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
      });
    }
    setIsMounted(true);
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(pos);
        },
        (error) => {
          console.error("Location error:", error);
          // Default location (New York)
          setUserLocation([40.7128, -74.0060]);
        }
      );
    } else {
      setUserLocation([40.7128, -74.0060]);
    }
  }, [isMounted]);

  // Calculate route between driver and customer
  const calculateRoute = async () => {
    if (!driverLocation || !userLocation) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${driverLocation.longitude},${driverLocation.latitude};${userLocation[1]},${userLocation[0]}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) throw new Error("Failed to fetch route");
      
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        setRoute(coordinates);
      }
    } catch (error) {
      console.error("Failed to calculate route:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate route when driver location changes
  useEffect(() => {
    if (driverLocation && userLocation && isMounted) {
      calculateRoute();
    }
  }, [driverLocation, userLocation, isMounted]);

  // Center map on driver location or user location
  useEffect(() => {
    if (mapRef.current && isMounted) {
      const center = driverLocation 
        ? [driverLocation.latitude, driverLocation.longitude] as [number, number]
        : userLocation || [40.7128, -74.0060];
      
      mapRef.current.setView(center, 13);
    }
  }, [driverLocation, userLocation, isMounted]);

  if (!isMounted || !userLocation || !L) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-xl">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">🔄</div>
          <p className="text-gray-500 text-sm">Loading map...</p>
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
        className="h-[300px] rounded-xl border border-blue-100"
        style={{ width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver marker */}
        {driverLocation && L && (
          <Marker
            position={[driverLocation.latitude, driverLocation.longitude]}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-900">🚚 {driverLocation.driver_name}</p>
                <p className="text-xs text-gray-500">Status: {driverLocation.status}</p>
                <p className="text-xs text-gray-500">
                  Updated: {new Date(driverLocation.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer marker */}
        {userLocation && L && (
          <Marker
            position={userLocation}
          >
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
        {route.length > 0 && L && (
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
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚚</span>
            <span className="text-gray-600 font-medium">Driver</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">📍</span>
            <span className="text-gray-600 font-medium">You</span>
          </div>
          {route.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-blue-500 border-t-2 border-dashed border-blue-500"></div>
              <span className="text-gray-600 font-medium">Route</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay for route */}
      {loading && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs text-gray-600 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin text-sm">🔄</div>
            Calculating route...
          </div>
        </div>
      )}
    </div>
  );
}