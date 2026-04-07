"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  LayoutDashboard, Home, Calendar, Users, Image, MapPin, Settings,
  LogOut, ChevronLeft, Menu, FileText, Star, CreditCard,
  Bell, Info, CheckCircle, AlertTriangle, XCircle, X, Building2, BarChart2, Link2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/submissions", label: "Submissions", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/owners", label: "Owners", icon: Building2 },
  { href: "/admin/reports", label: "Reports", icon: BarChart2 },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
  { href: "/admin/tours", label: "Virtual Tours", icon: MapPin },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/lodgify", label: "Lodgify Sync", icon: Link2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function TypeIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5 flex-shrink-0";
  if (type === "success") return <CheckCircle className={`${cls} text-emerald-400`} />;
  if (type === "warning") return <AlertTriangle className={`${cls} text-amber-400`} />;
  if (type === "error") return <XCircle className={`${cls} text-red-400`} />;
  return <Info className={`${cls} text-blue-400`} />;
}

function NotificationBell({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/admin/notifications/read", { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function handleClick(n: Notification) {
    if (!n.isRead) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
      fetch("/api/admin/notifications/read", { method: "POST" });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative px-2 pb-1">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors relative"
        title={collapsed ? "Notifications" : undefined}
      >
        <div className="relative flex-shrink-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#c9a961] text-white text-[9px] font-bold px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && <span className="text-sm font-medium">Notifications</span>}
        {!collapsed && unreadCount > 0 && (
          <span className="ml-auto text-[10px] bg-[#c9a961] text-white rounded-full px-1.5 py-0.5 font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{ width: "300px", left: collapsed ? "60px" : "4px" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-[#c9a961] hover:text-[#e8d5a3] font-medium">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-6 w-6 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">No notifications</p>
              </div>
            ) : notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-2.5 items-start hover:bg-white/5 transition-colors ${!n.isRead ? "bg-white/[0.03]" : ""}`}
              >
                <div className="mt-0.5"><TypeIcon type={n.type} /></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug truncate ${!n.isRead ? "font-semibold text-white" : "text-white/70"}`}>
                    {n.title}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{n.body}</p>
                  <p className="text-[10px] text-white/25 mt-1">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#c9a961] flex-shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname, setMobileOpen]);

  const isActive = (item: typeof navItems[0]) =>
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
          // Mobile: always w-64; Desktop: controlled by collapsed state
          `w-64 ${collapsed ? "md:w-16" : "md:w-60"}`,
          // Mobile: slide in/out; Desktop: always visible
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div>
              <p className="text-[#c9a961] font-['Playfair_Display'] font-bold text-lg leading-none">Golden Coast Stays</p>
              <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
            </div>
          )}
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
          {navItems.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active ? "bg-[#c9a961] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Notifications + Sign out */}
        <div className="border-t border-white/10 pt-2 pb-2">
          <NotificationBell collapsed={collapsed} />
          <div className="px-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
