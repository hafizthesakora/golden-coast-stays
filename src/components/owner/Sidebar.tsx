"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Home, Calendar, DollarSign, FileText, Globe, PlusCircle,
  ChevronLeft, Menu, LogOut, ExternalLink, Bell, Search, X, ShoppingBag,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/owner",             label: "Dashboard",       icon: LayoutDashboard, exact: true },
  { href: "/owner/properties",  label: "My Properties",   icon: Home },
  { href: "/owner/bookings",    label: "Bookings",        icon: Calendar },
  { href: "/owner/revenue",     label: "Revenue",         icon: DollarSign },
  { href: "/owner/services",    label: "Services",        icon: ShoppingBag },
  { href: "/owner/submissions", label: "My Submissions",  icon: FileText },
  { href: "/owner/tours",       label: "Virtual Tours",   icon: Globe },
  { href: "/owner/submit",      label: "Submit Property", icon: PlusCircle },
];

interface OwnerSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function OwnerSidebar({ mobileOpen, setMobileOpen }: OwnerSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  // Close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname, setMobileOpen]);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setUnread((d.notifications ?? []).filter((n: { isRead: boolean }) => !n.isRead).length))
      .catch(() => {});
  }, [pathname]);

  const isActive = (item: (typeof navItems)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed md:static inset-y-0 left-0 z-50 md:z-auto",
          "h-screen flex flex-col bg-[#0a0a0a] border-r border-white/10",
          "transition-all duration-300 flex-shrink-0",
          `w-64 ${collapsed ? "md:w-16" : "md:w-60"}`,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div>
              <p className="text-[#c9a961] font-['Playfair_Display'] font-bold text-lg leading-none">
                Golden Coast
              </p>
              <p className="text-white/40 text-xs mt-0.5">Owner Portal</p>
            </div>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors hidden md:flex"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-[#c9a961] text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}

          {/* Notifications */}
          <Link
            href="/owner/notifications"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
              pathname === "/owner/notifications"
                ? "bg-[#c9a961] text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title={collapsed ? "Notifications" : undefined}
          >
            <div className="relative flex-shrink-0">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            {!collapsed && (
              <span className="text-sm font-medium flex-1">Notifications</span>
            )}
            {!collapsed && unread > 0 && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                {unread}
              </span>
            )}
          </Link>

          {/* Divider */}
          <div className="border-t border-white/10 my-2" />

          {/* Browse Stays */}
          <Link
            href="/stays"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
            title={collapsed ? "Browse Stays" : undefined}
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm flex items-center gap-1.5">
                Browse Stays <ExternalLink className="h-3 w-3 opacity-50" />
              </span>
            )}
          </Link>
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
    </>
  );
}
