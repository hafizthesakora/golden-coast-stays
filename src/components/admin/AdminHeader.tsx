"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

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
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function TypeIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 flex-shrink-0";
  switch (type) {
    case "success":
      return <CheckCircle className={`${cls} text-emerald-500`} />;
    case "warning":
      return <AlertTriangle className={`${cls} text-amber-500`} />;
    case "error":
      return <XCircle className={`${cls} text-red-500`} />;
    default:
      return <Info className={`${cls} text-blue-500`} />;
  }
}

function typeBorderColor(type: string) {
  switch (type) {
    case "success": return "border-l-emerald-400";
    case "warning": return "border-l-amber-400";
    case "error":   return "border-l-red-400";
    default:        return "border-l-blue-400";
  }
}

export default function AdminHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and every 60s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleMarkAllRead() {
    if (markingRead) return;
    setMarkingRead(true);
    try {
      await fetch("/api/admin/notifications/read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleNotificationClick(n: Notification) {
    // Mark as read locally
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // Fire-and-forget: mark all read (simple approach since no per-item endpoint)
      fetch("/api/admin/notifications/read", { method: "POST" });
    }
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e9ecef] flex items-center justify-end px-6 h-14 flex-shrink-0">
      {/* Right: Bell */}
      <div className="relative">
        <button
          ref={bellRef}
          onClick={() => setOpen((o) => !o)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f4f5f7] transition-colors text-[#6c757d] hover:text-[#1a1a1a]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#c9a961] text-white text-[10px] font-bold px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Slide-down Panel */}
        {open && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl border border-[#e9ecef] shadow-xl overflow-hidden"
            style={{ animation: "slideDown 0.18s ease-out" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-[#6c757d]">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markingRead}
                    className="text-xs text-[#c9a961] font-medium hover:text-[#9a7b3c] transition-colors disabled:opacity-50"
                  >
                    {markingRead ? "Marking…" : "Mark all as read"}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#f4f5f7] text-[#6c757d] hover:text-[#1a1a1a] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-[#f0f0f0]">
              {loading && notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#6c757d]">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-8 w-8 text-[#dee2e6] mx-auto mb-2" />
                  <p className="text-sm text-[#6c757d]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 items-start border-l-2 transition-colors hover:bg-[#f8f9fa] ${
                      typeBorderColor(n.type)
                    } ${!n.isRead ? "bg-[#fffbf3]" : "bg-white"}`}
                  >
                    <div className="mt-0.5">
                      <TypeIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug truncate ${!n.isRead ? "font-semibold text-[#1a1a1a]" : "font-medium text-[#343a40]"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#c9a961] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[#6c757d] mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-[#adb5bd] mt-1">{relativeTime(n.createdAt)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
