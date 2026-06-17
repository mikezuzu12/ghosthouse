"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

export default function DriverLocationTracker({ orderId }: { orderId: string }) {
  const { data: session } = useSession();
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>("");
  const [watchId, setWatchId] = useState<number | null>(null);

  const driverId = Number((session?.user as any)?.id);
  const driverName = (session?.user as any)?.name || "Driver";

  // Start tracking location
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setError("");

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        // Send location to server
        updateDriverLocation(position);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    // Set status to idle
    updateDriverStatus('idle');
  };

  // Send location to Supabase
  const updateDriverLocation = async (position: GeolocationPosition) => {
    try {
      // Updated to use /api/drivers/location
      await fetch("/api/drivers/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
          driver_name: driverName,
          order_id: orderId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          status: 'active'
        }),
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  // Update driver status
  const updateDriverStatus = async (status: 'active' | 'idle' | 'offline') => {
    try {
      // Updated to use /api/drivers/status
      await fetch("/api/drivers/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
          order_id: orderId,
          status
        }),
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        updateDriverStatus('offline');
      }
    };
  }, [watchId]);

  return (
    <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <h3 className="font-semibold text-blue-900">Live Location</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-500">
            {isTracking ? 'Live' : 'Off'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {location && isTracking && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Latitude:</span>{" "}
              {location.coords.latitude.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">Longitude:</span>{" "}
              {location.coords.longitude.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">Accuracy:</span>{" "}
              {location.coords.accuracy.toFixed(0)}m
            </div>
            <div>
              <span className="font-medium">Speed:</span>{" "}
              {location.coords.speed ? (location.coords.speed * 3.6).toFixed(1) : '0'} km/h
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="flex-1 bg-[#378ADD] text-white px-4 py-2 rounded-lg hover:bg-[#185FA5] transition text-sm font-medium"
          >
            🚀 Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
          >
            ⏹ Stop Tracking
          </button>
        )}
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setLocation(pos),
                (err) => setError(`Location error: ${err.message}`)
              );
            }
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {isTracking 
          ? "📍 Your location is being shared with the customer" 
          : "🔒 Location sharing is turned off"}
      </p>
    </div>
  );
}