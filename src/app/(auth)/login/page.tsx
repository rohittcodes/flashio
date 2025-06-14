import Login from "@/components/auth/login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Flashio",
  description: "Log in to your Flashio account",
};

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account to continue</p>
        </div>
        <Login />
      </div>
    </div>
  );
}