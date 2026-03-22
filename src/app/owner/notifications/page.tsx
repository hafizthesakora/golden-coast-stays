"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; bg: string; iconColor: string }> = {
  info:    { icon: <Info className="h-4 w-4" />,          bg: "bg-blue-50",    iconColor: "text-blue-500" },
  success: { icon: <CheckCircle className="h-4 w-4" />,   bg: "bg-emerald-50", iconColor: "text-emerald-500" },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: "bg-amber-50",   iconColor: "text-amber-500" },
  error:   { icon: <XCircle className="h-4 w-4" />,       bg: "bg-red-50",     iconColor: "text-red-500" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            Notifications
            {unread > 0 && (
              <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-red-100 text-red-600">{unread} unread</span>
            )}
          </h1>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e9ecef] text-sm text-[#343a40] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors bg-white"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-[#e9ecef] rounded animate-pulse" />
                    <div className="h-3 w-full bg-[#f0f0f0] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-white/80 p-16 text-center shadow-sm">
            <Bell className="h-12 w-12 text-[#c9a961] mx-auto mb-4" />
            <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-2">No notifications yet</h3>
            <p className="text-[#6c757d]">You'll receive alerts here for new bookings, status updates, and messages from our team.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const cfg = typeConfig[n.type] ?? typeConfig.info;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all cursor-default ${
                    n.isRead ? "border-white/80 opacity-70" : "border-[#c9a961]/30 shadow-md"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 ${cfg.iconColor}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm ${n.isRead ? "text-[#343a40]" : "text-[#1a1a1a]"}`}>
                          {n.title}
                          {!n.isRead && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#c9a961] align-middle" />}
                        </p>
                        <span className="text-xs text-[#adb5bd] flex-shrink-0">{formatDate(new Date(n.createdAt))}</span>
                      </div>
                      <p className="text-sm text-[#6c757d] mt-0.5">{n.body}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="inline-flex items-center gap-1 text-xs text-[#c9a961] hover:underline mt-1.5 font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          View details <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
