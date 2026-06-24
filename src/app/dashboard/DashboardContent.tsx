// src/app/dashboard/DashboardContent.tsx
'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import OrderChat from "@/app/components/OrderChat";
import ClientOnlyMap from "@/app/components/ClientOnlyMap";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/app/components/NotificationBell";

// ... ALL your existing dashboard code goes here ...
// (Your entire dashboard component code)