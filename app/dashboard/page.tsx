"use client";

import TruckFinder from "@/components/truck-finder";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();
  
  return (
    <main className="container mx-auto py-8 px-4 mt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {session?.user?.name || "User"}!
        </p>
      </div>
      
      <div className="dashboard-content">
        <TruckFinder />
      </div>
    </main>
  );
} 