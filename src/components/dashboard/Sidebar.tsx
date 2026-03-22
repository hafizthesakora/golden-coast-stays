"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Calendar, Heart, Settings,
  Home, LogOut, ChevronLeft, Menu,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";

const navItems = [
  { href: "/dashboard",              label: "Dashboard",    icon: LayoutDashboard, tab: null },
  { href: "/dashboard?tab=bookings", label: "My Bookings",  icon: Calendar,        tab: "bookings" },
  { href: "/dashboard?tab=saved",    label: "Saved Stays",  icon: Heart,           tab: "saved" },
  { href: "/stays",                  label: "Browse Stays", icon: Home,            tab: "__stays" },
  { href: "/dashboard?tab=account",  label: "Account",      icon: Settings,        tab: "account" },
];

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  // Local active-tab state — updated by custom event so URL replaceState keeps sidebar in sync
  const [activeTab, setActiveTab] = useState<string | null>(searchParams.get("tab"));

  // Auto-collapse on small screens
  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keep in sync when custom tab-change events are fired
  useEffect(() => {
    const handler = (e: Event) => {
      setActiveTab((e as CustomEvent<{ tab: string }>).detail.tab || null);
    };
    window.addEventListener("dashboard:tab", handler);
    return () => window.removeEventListener("dashboard:tab", handler);
  }, []);

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.tab === "__stays") return pathname.startsWith("/stays");
    if (pathname !== "/dashboard") return false;
    return item.tab === activeTab;
  };

  // Click handler: dashboard tabs switch client-side via custom event + replaceState.
  // /stays link navigates normally.
  const handleClick = (e: React.MouseEvent, item: (typeof navItems)[0]) => {
    if (!item.href.startsWith("/dashboard")) return; // let /stays navigate normally
    e.preventDefault();
    window.history.replaceState({}, "", item.href);
    window.dispatchEvent(
      new CustomEvent("dashboard:tab", { detail: { tab: item.tab ?? "" } })
    );
  };

  return (
    <>
      {/* Sidebar — hidden on mobile (<640px), icon-only on md, full on lg */}
      <aside
        className={`hidden sm:flex h-screen sticky top-0 flex-col bg-[#0a0a0a] border-r border-white/10 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div>
              <p className="text-[#c9a961] font-['Playfair_Display'] font-bold text-lg leading-none">
                Golden Coast
              </p>
              <p className="text-white/40 text-xs mt-0.5">Guest Portal</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleClick(e, item)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-[#c9a961] text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}

          <div className="border-t border-white/10 my-2" />
        </nav>

        {/* Sign out */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item)}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                active ? "text-[#c9a961]" : "text-white/50 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-white/50 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[9px] font-medium">Sign Out</span>
        </button>
      </nav>
    </>
  );
}

export default function GuestSidebar() {
  return (
    <Suspense fallback={<aside className="hidden sm:block w-16 h-screen bg-[#0a0a0a] flex-shrink-0" />}>
      <SidebarInner />
    </Suspense>
  );
}
