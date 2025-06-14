'use client';

import { signOut } from "@/lib/auth";
import { Button } from "../ui/button";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function Logout() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({ redirectTo: '/' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}