
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Flashio",
  description: "Manage your coding projects",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="w-full max-w-3xl space-y-6 text-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Manage your coding projects and settings</p>
        {/* Add your dashboard components here */}
      </div>
    </div>
  );
}
