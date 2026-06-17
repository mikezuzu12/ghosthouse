"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RealtimeTest({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    const channel = supabase
      .channel(`test-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("🔴 TEST: New message received!", payload);
          setStatus("✅ Message received!");
        }
      )
      .subscribe((status) => {
        console.log("🔴 TEST: Subscription status:", status);
        setStatus(`🔴 ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return (
    <div className="bg-yellow-50 p-2 text-xs rounded">
      Realtime Status: {status}
    </div>
  );
}