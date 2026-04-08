"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar, Heart, Settings, BookOpen, MapPin, Clock,
  ArrowRight, Trash2, CheckCircle, AlertCircle, Loader2,
  X, CreditCard, TrendingUp, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Booking {
  id: string;
  reference: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  nights: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  property: {
    id: string;
    title: string;
    city: string;
    slug: string;
    images: { imageUrl: string }[];
  };
}

interface Property {
  id: string;
  title: string;
  slug: string;
  city: string;
  propertyType: string;
  pricePerNight: number;
  bedrooms: number;
  images: { imageUrl: string }[];
}

interface Props {
  user: { name: string; email: string; phone: string };
  bookings: Booking[];
  favorites: Property[];
  stats: { total: number; upcoming: number; completed: number; saved: number };
}

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const payColors: Record<string, string> = {
  paid:     "text-emerald-600 bg-emerald-50",
  pending:  "text-amber-600 bg-amber-50",
  failed:   "text-red-600 bg-red-50",
  refunded: "text-blue-600 bg-blue-50",
};

export default function DashboardClient({ user, bookings, favorites, stats }: Props) {
  const searchParams = useSearchParams();
  // Initialize tab from URL, then manage locally — tab changes via sidebar
  // fire a custom event + replaceState so no server re-render occurs.
  const [tab, setTab] = useState(searchParams.get("tab") ?? "overview");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: string }>).detail;
      setTab(detail.tab || "overview");
    };
    window.addEventListener("dashboard:tab", handler);
    return () => window.removeEventListener("dashboard:tab", handler);
  }, []);

  const [localFavorites, setLocalFavorites] = useState(favorites);
  const [localBookings, setLocalBookings] = useState(bookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  // Profile form
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hoursUntil = (date: Date | string) =>
    (new Date(date).getTime() - Date.now()) / 3_600_000;

  const refundTier = (checkIn: Date | string, paid: boolean): string => {
    if (!paid) return "No payment was made — no refund needed.";
    const h = hoursUntil(checkIn);
    if (h >= 48) return "Full refund — you're cancelling more than 48 hours before check-in.";
    if (h >= 24) return "50% refund — cancellation within 24–48 hours of check-in.";
    return "No refund — cancellation within 24 hours of check-in.";
  };

  const cancelBooking = async (id: string) => {
    setPendingCancelId(null);
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLocalBookings((bs) =>
          bs.map((b) =>
            b.id === id
              ? { ...b, status: "cancelled", paymentStatus: data.refunded ? "refunded" : b.paymentStatus }
              : b
          )
        );
      }
    } finally {
      setCancellingId(null);
    }
  };

  const removeFavorite = async (propertyId: string) => {
    setLocalFavorites((f) => f.filter((p) => p.id !== propertyId));
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, action: "remove" }),
    });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: (err as Error).message });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      setPwMsg({ type: "error", text: "New passwords don't match." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch (err) {
      setPwMsg({ type: "error", text: (err as Error).message });
    } finally {
      setPwSaving(false);
    }
  };

  const firstName = user.name.split(" ")[0];
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const recentBookings = localBookings.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Guest Portal</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-medium text-[#343a40]">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-xs text-[#adb5bd]">{now.getFullYear()}</p>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {/* Hero row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* Dark hero card */}
              <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#c9a961]/10 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#c9a961]/5 translate-y-8 -translate-x-8" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a961]/20 flex items-center justify-center mb-4">
                    <BookOpen className="h-5 w-5 text-[#c9a961]" />
                  </div>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Total Bookings</p>
                  <p className="font-['Playfair_Display'] text-4xl font-bold mb-1">{stats.total}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white/40 text-xs">Completed</p>
                      <p className="text-white font-semibold text-sm">{stats.completed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 KPI cards */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: "Upcoming Stays",   value: stats.upcoming,  sub: "Confirmed or pending",   icon: Clock,      accent: "#c9a961", bg: "bg-amber-50" },
                  { label: "Completed Stays",  value: stats.completed, sub: "Stays checked out",       icon: Star,       accent: "#3b82f6", bg: "bg-blue-50" },
                  { label: "Saved Properties", value: stats.saved,     sub: "In your wishlist",        icon: Heart,      accent: "#ef4444", bg: "bg-red-50" },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <card.icon className="h-5 w-5" style={{ color: card.accent }} />
                      </div>
                    </div>
                    <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-2xl leading-none mb-1">
                      {card.value}
                    </p>
                    <p className="text-[#6c757d] text-xs">{card.label}</p>
                    <p className="text-[#adb5bd] text-xs mt-1">{card.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent bookings + quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Recent Bookings */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
                  <div>
                    <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Latest Activity</p>
                    <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Recent Bookings</h2>
                  </div>
                  <Link href="/dashboard?tab=bookings" className="flex items-center gap-1.5 text-[#c9a961] text-sm font-semibold hover:text-[#9a7b3c] transition-colors">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {recentBookings.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-7 w-7 text-[#c9a961]" />
                    </div>
                    <p className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] mb-1">No bookings yet</p>
                    <p className="text-[#6c757d] text-sm">Browse our premium stays and make your first booking.</p>
                    <Link href="/stays" className="inline-block mt-4">
                      <Button variant="gold">Browse Stays</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider">
                          <th className="px-5 py-3 text-left font-medium">Property</th>
                          <th className="px-5 py-3 text-left font-medium">Check-in</th>
                          <th className="px-5 py-3 text-left font-medium">Amount</th>
                          <th className="px-5 py-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8f9fa]">
                        {recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-[#fafafa] transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#c9a961]/15 flex items-center justify-center text-[#c9a961] font-bold text-xs flex-shrink-0">
                                  {b.property.title.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-[#1a1a1a] text-xs line-clamp-1">{b.property.title}</p>
                                  <p className="text-[#adb5bd] text-xs">{b.property.city}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[#343a40] text-xs">
                              {formatDate(b.checkIn)}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-[#1a1a1a] text-xs">
                              {formatCurrency(Number(b.totalAmount))}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Saved stays preview */}
                <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#f8f9fa]">
                    <div>
                      <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Wishlist</p>
                      <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Saved Stays</h2>
                    </div>
                    <Link href="/dashboard?tab=saved" className="text-[#c9a961] text-xs font-semibold hover:text-[#9a7b3c]">
                      View all
                    </Link>
                  </div>
                  <div className="divide-y divide-[#f8f9fa]">
                    {localFavorites.slice(0, 4).map((prop) => {
                      const thumbnail = prop.images?.[0]?.imageUrl;
                      return (
                        <div key={prop.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors">
                          <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0 relative">
                            {thumbnail ? (
                              <Image src={thumbnail} alt={prop.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Heart className="h-4 w-4 text-[#adb5bd]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1a1a1a] truncate">{prop.title}</p>
                            <p className="text-xs text-[#6c757d]">{prop.city} · {formatCurrency(Number(prop.pricePerNight))}/night</p>
                          </div>
                        </div>
                      );
                    })}
                    {localFavorites.length === 0 && (
                      <div className="px-5 py-8 text-center">
                        <p className="text-[#6c757d] text-sm">No saved stays yet.</p>
                        <Link href="/stays" className="text-[#c9a961] text-sm font-semibold mt-1 inline-block hover:text-[#9a7b3c]">
                          Browse stays →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm">
                  <div className="mb-4">
                    <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium mb-0.5">Shortcuts</p>
                    <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Quick Actions</h2>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { href: "/stays",                   label: "Browse Properties",    icon: TrendingUp },
                      { href: "/dashboard?tab=bookings",  label: "My Bookings",          icon: Calendar },
                      { href: "/dashboard?tab=saved",     label: "Saved Stays",          icon: Heart },
                      { href: "/dashboard?tab=account",   label: "Account Settings",     icon: Settings },
                    ].map((a) => (
                      <Link
                        key={a.href}
                        href={a.href}
                        className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-[#f8f9fa] transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#c9a961]/10 flex items-center justify-center flex-shrink-0">
                          <a.icon className="h-4 w-4 text-[#c9a961]" />
                        </div>
                        <span className="text-sm text-[#343a40] flex-1 font-medium">{a.label}</span>
                        <ArrowRight className="h-3 w-3 text-[#adb5bd] group-hover:text-[#c9a961] transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MY BOOKINGS ───────────────────────────────────────────────────── */}
        {tab === "bookings" && (
          <div className="space-y-4">
            <div className="mb-2">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">History</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl">My Bookings</h2>
            </div>
            {localBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-white/80 p-12 text-center shadow-sm">
                <Calendar className="h-12 w-12 text-[#c9a961] mx-auto mb-4" />
                <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-2">No bookings yet</h3>
                <p className="text-[#6c757d] mb-5">Discover our premium stays and make your first booking today.</p>
                <Link href="/stays"><Button variant="gold">Browse Stays</Button></Link>
              </div>
            ) : localBookings.map((b) => {
              const img = b.property.images[0]?.imageUrl || "/images/h1.jpg";
              const canCancel = b.status === "pending" || b.status === "confirmed";
              const isCompleted = b.status === "completed";
              return (
                <div key={b.id} className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row gap-5 transition-opacity ${b.status === "cancelled" ? "opacity-60" : "border-white/80"}`}>
                  <div className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={img} alt={b.property.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg">{b.property.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {b.status}
                        </span>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-semibold capitalize flex items-center gap-1 ${payColors[b.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          <CreditCard className="h-3 w-3" />{b.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <p className="text-[#6c757d] text-sm flex items-center gap-1 mb-3">
                      <MapPin className="h-3.5 w-3.5 text-[#c9a961]" />{b.property.city}, Ghana
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-[#343a40] mb-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#c9a961]" />
                        {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                      </span>
                      <span>{b.nights} night{b.nights !== 1 ? "s" : ""} · {b.guests} guest{b.guests !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="font-bold text-[#1a1a1a]">{formatCurrency(Number(b.totalAmount))}</span>
                        <span className="text-xs text-[#6c757d] ml-2">Ref: {b.reference}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {canCancel && (
                          <button
                            onClick={() => setPendingCancelId(pendingCancelId === b.id ? null : b.id)}
                            disabled={cancellingId === b.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                            Cancel
                          </button>
                        )}
                        {isCompleted && (
                          <Link href={`/book/${b.property.id}`}>
                            <Button variant="gold" size="sm" className="gap-1">
                              Book Again <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/stays/${b.property.slug}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-[#c9a961]">
                            View <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  {/* Cancellation confirmation card */}
                  {pendingCancelId === b.id && (
                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="font-semibold text-[#1a1a1a] text-sm mb-1">Cancel this booking?</p>
                      <p className="text-[#6c757d] text-xs mb-1">
                        {refundTier(b.checkIn, b.paymentStatus === "paid")}
                      </p>
                      <p className="text-[#adb5bd] text-[10px] mb-3">
                        Refunds are processed within 5–7 business days via your original payment method.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => cancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          Yes, Cancel Booking
                        </button>
                        <button
                          onClick={() => setPendingCancelId(null)}
                          className="px-3 py-1.5 text-xs rounded-xl border border-[#e9ecef] text-[#343a40] hover:bg-[#f8f9fa] transition-colors"
                        >
                          Keep Booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* ── SAVED STAYS ───────────────────────────────────────────────────── */}
        {tab === "saved" && (
          <div>
            <div className="mb-4">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Wishlist</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl">Saved Stays</h2>
            </div>
            {localFavorites.length === 0 ? (
              <div className="bg-white rounded-2xl border border-white/80 p-12 text-center shadow-sm">
                <Heart className="h-12 w-12 text-[#c9a961] mx-auto mb-4" />
                <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-2">No saved stays</h3>
                <p className="text-[#6c757d] mb-5">Browse properties and click the heart icon to save your favourites.</p>
                <Link href="/stays"><Button variant="gold">Browse Stays</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localFavorites.map((p) => {
                  const img = p.images[0]?.imageUrl || "/images/h1.jpg";
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm group">
                      <div className="relative h-48">
                        <Image src={img} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        <button
                          onClick={() => removeFavorite(p.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] mb-1 group-hover:text-[#c9a961] transition-colors">{p.title}</h3>
                        <p className="text-[#6c757d] text-xs flex items-center gap-1 mb-3">
                          <MapPin className="h-3 w-3 text-[#c9a961]" />{p.city}, Ghana
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1a1a1a]">
                            {formatCurrency(Number(p.pricePerNight))}
                            <span className="text-xs text-[#6c757d] font-normal">/night</span>
                          </span>
                          <Link href={`/stays/${p.slug}`}><Button variant="gold" size="sm">Book Now</Button></Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNT SETTINGS ─────────────────────────────────────────────── */}
        {tab === "account" && (
          <div>
            <div className="mb-4">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Preferences</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl">Account Settings</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl mb-5">Profile Details</h3>
                <form className="space-y-4" onSubmit={saveProfile}>
                  {profileMsg && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${profileMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {profileMsg.type === "success" ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                      {profileMsg.text}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-[#343a40] mb-1.5">Full Name</label>
                    <input value={profileName} onChange={(e) => setProfileName(e.target.value)} required
                      className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#343a40] mb-1.5">Email</label>
                    <input value={user.email} readOnly
                      className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm bg-[#f8f9fa] text-[#6c757d]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#343a40] mb-1.5">Phone</label>
                    <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+233..."
                      className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                  </div>
                  <Button variant="gold" type="submit" disabled={profileSaving}>
                    {profileSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
                  </Button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl mb-5">Change Password</h3>
                <form className="space-y-4" onSubmit={changePassword}>
                  {pwMsg && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${pwMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {pwMsg.type === "success" ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                      {pwMsg.text}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-[#343a40] mb-1.5">Current Password</label>
                    <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required
                      className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#343a40] mb-1.5">New Password</label>
                    <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} required minLength={8}
                      className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#343a40] mb-1.5">Confirm New Password</label>
                    <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} required
                      className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                  </div>
                  <Button variant="dark" type="submit" disabled={pwSaving}>
                    {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</> : "Update Password"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
