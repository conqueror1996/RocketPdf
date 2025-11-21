// src/layouts/DashboardLayout.jsx

import React from "react";
import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ToolCard from "../components/Toolcard";

function ShuttleIcon({ className = "w-20 h-20" }) {
  return (
    <motion.div
      initial={{ y: 0, rotate: -5, scale: 0.98 }}
      animate={{ y: [0, -8, 0], rotate: [-5, 5, -5], scale: [0.98, 1, 0.98] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      className={`shuttle-glow shuttle-float ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0" stopColor="#6366f1" stopOpacity="0.95" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect
          x="6"
          y="18"
          width="40"
          height="20"
          rx="4"
          fill="url(#g1)"
          opacity="0.12"
        />
        <path
          d="M50 12c-2 0-12 4-18 4S14 12 12 12s6 18 8 22 6 8 6 8 10-2 14-2 10-6 12-10 0-20 0-20z"
          fill="#4f46e5"
          opacity="0.9"
        />
        <circle cx="46" cy="30" r="4" fill="#fff" opacity="0.95" />
      </svg>
    </motion.div>
  );
}

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 text-slate-900 dark:text-slate-100">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <Link to="/" className="flex items-center gap-3">
          <ShuttleIcon className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">RocketPDF</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convert & manage PDFs
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/tools"
            className="px-4 py-2 border rounded-md bg-white/60 dark:bg-slate-800/50"
          >
            All Tools
          </Link>
          <Link to="/viewer" state={{ file: null }}>
  <ToolCard
    title="Edit PDF Text"
    description="Edit, add or remove text from your PDF."
  />
</Link>

        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1240px] mx-auto py-10 px-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
        Made with ❤️ — RocketPDF
      </footer>
    </div>
  );
}
