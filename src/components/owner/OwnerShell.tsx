"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import OwnerSidebar from "@/components/owner/Sidebar";

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <OwnerSidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 flex items-center px-4 bg-white border-b border-[#e9ecef] flex-shrink-0 shadow-sm z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#343a40] hover:bg-[#f0f0f0] transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-semibold text-[#1a1a1a] text-sm">Owner Portal</span>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          {children}
        </main>
      </div>
    </div>
  );
}
