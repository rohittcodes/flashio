'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >          <Image
            src="/logo.svg"
            alt="Flashio Logo"
            width={120}
            height={120}
            className="rounded-2xl shadow-2xl"
          />
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl rounded-3xl" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          Flash.io 
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-gray-300 mb-8 max-w-2xl"
        >
          Experience the future of coding with AI-powered assistance, real-time
          collaboration, and intelligent code generation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/dashboard">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Launch Editor
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 py-16 max-w-7xl mx-auto"
      >
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
            <Image src="/file.svg" alt="AI" width={24} height={24} />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI-Powered Coding</h3>
          <p className="text-gray-400">
            Get intelligent code suggestions and autocompletions powered by
            advanced AI models.
          </p>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
            <Image src="/window.svg" alt="Collaboration" width={24} height={24} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
          <p className="text-gray-400">
            Code together in real-time with team members and share your workspace
            instantly.
          </p>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center mb-4">
            <Image src="/globe.svg" alt="Cloud" width={24} height={24} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Cloud-Powered</h3>
          <p className="text-gray-400">
            Your code is automatically saved and synced across all your devices.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
