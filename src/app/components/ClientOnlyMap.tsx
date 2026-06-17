"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the map with no SSR
const LiveMap = dynamic(
  () => import('@/app/components/LiveMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">🔄</div>
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
);

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

export default function ClientOnlyMap(props: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-[300px] bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">🔄</div>
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return <LiveMap {...props} />;
}