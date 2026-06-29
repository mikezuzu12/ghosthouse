"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

type Props = { orderId: string; autoStart?: boolean };

export default function DriverLocationTracker({ orderId, autoStart = true }: Props) {
  const { data: session } = useSession();
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);

  const driverId = Number((session?.user as any)?.id);
  const driverName = (session?.user as any)?.name || "Driver";

  const updateDriverLocation = async (position: GeolocationPosition) => {
    try {
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
          status: "active",
        }),
      });
    } catch (err) {
      console.error("Failed to update location:", err);
    }
  };

  const updateDriverStatus = async (status: "active" | "idle" | "offline") => {
    try {
      await fetch("/api/drivers/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId, order_id: orderId, status }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    if (watchIdRef.current !== null) return; // already tracking

    setIsTracking(true);
    setError("");

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        updateDriverLocation(position);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = id;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    updateDriverStatus("idle");
  };

  // ✅ Auto-start when component mounts
  useEffect(() => {
    if (autoStart && session) {
      startTracking();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        updateDriverStatus("offline");
      }
    };
  }, [session]); // wait for session so driverId is available

  return (
    <div
      className="rounded-xl border border-white/10 p-4"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <h3 className="font-semibold text-white">Live Location</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isTracking ? "bg-green-500 animate-pulse" : "bg-gray-500"
            }`}
          />
          <span className="text-xs text-slate-400">
            {isTracking ? "Live" : "Off"}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {location && isTracking && (
        <div
          className="rounded-lg p-3 text-sm text-slate-400 mb-4"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Latitude:</span>{" "}
              {location.coords.latitude.toFixed(6)}
            </div>
            <div>
              <span className="text-slate-500">Longitude:</span>{" "}
              {location.coords.longitude.toFixed(6)}
            </div>
            <div>
              <span className="text-slate-500">Accuracy:</span>{" "}
              {location.coords.accuracy.toFixed(0)}m
            </div>
            <div>
              <span className="text-slate-500">Speed:</span>{" "}
              {location.coords.speed
                ? (location.coords.speed * 3.6).toFixed(1)
                : "0"}{" "}
              km/h
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
          >
            🚀 Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
          >
            ⏹ Stop Tracking
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-3">
        {isTracking
          ? "📍 Your location is being shared with the customer"
          : "🔒 Location sharing is turned off"}
      </p>
    </div>
  );
}