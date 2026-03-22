import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, serialize } from "@/lib/utils";
import Link from "next/link";
import {
  PlusCircle, DollarSign, Home, Calendar, FileText,
  ArrowRight, TrendingUp, Users, Star, CheckCircle,
  Clock, XCircle, Globe,
} from "lucide-react";
import { RevenueBarChart, BookingDonut } from "@/components/admin/DashboardCharts";
import Image from "next/image";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthStart(monthsAgo: number) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

export default async function OwnerDashboard() {
  const session = await auth();
  const userId = (session as { user?: { id?: string } })?.user?.id ?? "";
  const name = (session as { user?: { name?: string } })?.user?.name;
  const firstName = name?.split(" ")[0] ?? "there";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const [properties, allBookings, last6MonthsBookings, pendingSubmissions] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        bookings: true,
        images: { take: 1, orderBy: [{ isPrimary: "desc" }] },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.booking.findMany({
      where: { property: { ownerId: userId } },
      include: { property: { select: { title: true, city: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { property: { ownerId: userId }, createdAt: { gte: monthStart(5) } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true },
    }),
    prisma.propertySubmission.count({ where: { userId, status: "pending" } }),
  ]);

  // ── KPI calculations ──────────────────────────────────────────────────────
  const totalRevenue = allBookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = allBookings
    .filter((b) => b.paymentStatus === "paid" && new Date(b.createdAt) >= thisMonthStart)
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  const activeProperties = properties.filter((p) => p.status === "available").length;
  const confirmedBookings = allBookings.filter((b) => b.status === "confirmed").length;
  const upcomingBookings = allBookings.filter(
    (b) => new Date(b.checkIn) >= now && b.status !== "cancelled"
  ).length;
  const avgBookingValue =
    allBookings.length > 0
      ? allBookings.reduce((s, b) => s + Number(b.totalAmount), 0) / allBookings.length
      : 0;
  const totalReviews = properties.reduce((s, p) => s + p.reviews.length, 0);

  // ── Monthly chart data ────────────────────────────────────────────────────
  const monthly: { month: string; revenue: number; bookings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = monthStart(i);
    const end = i === 0
      ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
      : monthStart(i - 1);
    const slice = last6MonthsBookings.filter(
      (b) => new Date(b.createdAt) >= start && new Date(b.createdAt) < end
    );
    monthly.push({
      month: MONTH_LABELS[start.getMonth()],
      revenue: slice
        .filter((b) => b.paymentStatus === "paid")
        .reduce((s, b) => s + Number(b.totalAmount), 0),
      bookings: slice.length,
    });
  }

  // ── Booking status breakdown ───────────────────────────────────────────────
  const statusBreakdown = [
    { label: "Confirmed", count: allBookings.filter((b) => b.status === "confirmed").length, color: "#10b981" },
    { label: "Pending",   count: allBookings.filter((b) => b.status === "pending").length,   color: "#f59e0b" },
    { label: "Completed", count: allBookings.filter((b) => b.status === "completed").length, color: "#3b82f6" },
    { label: "Cancelled", count: allBookings.filter((b) => b.status === "cancelled").length, color: "#ef4444" },
  ].filter((s) => s.count > 0);

  // ── Top properties by revenue ─────────────────────────────────────────────
  type OwnerPageProperty = typeof properties[number];
  type OwnerPageBooking = OwnerPageProperty["bookings"][number];

  const propertyRevenue = properties.map((p: OwnerPageProperty) => ({
    title: p.title,
    bookings: p.bookings.length,
    revenue: p.bookings
      .filter((b: OwnerPageBooking) => b.paymentStatus === "paid")
      .reduce((s: number, b: OwnerPageBooking) => s + Number(b.totalAmount), 0),
  }));

  const recentBookings = serialize(allBookings.slice(0, 8));
  const propertiesSerial = serialize(properties);

  const bookingStatusPill = (status: string) => {
    const map: Record<string, string> = {
      confirmed: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
  };

  const paymentPill = (status: string) => {
    const map: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      failed: "bg-red-100 text-red-700",
      refunded: "bg-purple-100 text-purple-700",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-[#343a40]">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-[#adb5bd]">{now.getFullYear()}</p>
          </div>
          <Link
            href="/owner/submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
          >
            <PlusCircle className="h-4 w-4" /> Submit Property
          </Link>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Hero Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Dark hero card — Total Revenue */}
          <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#c9a961]/10 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#c9a961]/5 translate-y-8 -translate-x-8" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#c9a961]/20 flex items-center justify-center mb-4">
                <DollarSign className="h-5 w-5 text-[#c9a961]" />
              </div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="font-['Playfair_Display'] text-3xl font-bold mb-1">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-white/40 text-xs">This month</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(thisMonthRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 KPI cards */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-5">
            {[
              {
                label: "Active Properties",
                value: activeProperties,
                sub: `${properties.length} total`,
                icon: Home,
                accent: "#c9a961",
                bg: "bg-amber-50",
              },
              {
                label: "Total Bookings",
                value: allBookings.length,
                sub: `${confirmedBookings} confirmed`,
                icon: Calendar,
                accent: "#3b82f6",
                bg: "bg-blue-50",
              },
              {
                label: "Pending Submissions",
                value: pendingSubmissions,
                sub: "Awaiting review",
                icon: FileText,
                accent: "#f59e0b",
                bg: "bg-amber-50",
              },
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

        {/* ── Secondary Stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Confirmed",      value: confirmedBookings,                          icon: CheckCircle, color: "#10b981" },
            { label: "Upcoming",       value: upcomingBookings,                           icon: Clock,       color: "#3b82f6" },
            { label: "Avg Booking",    value: formatCurrency(Math.round(avgBookingValue)), icon: TrendingUp,  color: "#c9a961" },
            { label: "Total Reviews",  value: totalReviews,                               icon: Star,        color: "#f59e0b" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-white/80 p-4 flex items-center gap-3 shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1a1a1a] text-base leading-none truncate">{s.value}</p>
                <p className="text-[#6c757d] text-xs mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f8f9fa]">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Last 6 Months</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Revenue Overview</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-4 mb-4 text-xs text-[#6c757d]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#c9a961] to-[#9a7b3c] inline-block" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#1a1a1a]/15 inline-block" />
                  Bookings
                </span>
              </div>
              <RevenueBarChart monthly={monthly} />
            </div>
          </div>

          {/* Booking Donut */}
          <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f8f9fa]">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Breakdown</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Booking Status</h2>
            </div>
            <div className="px-6 py-6">
              <BookingDonut data={statusBreakdown} />
            </div>
          </div>
        </div>

        {/* ── Bottom Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Bookings Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
              <div>
                <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Latest Activity</p>
                <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Recent Bookings</h2>
              </div>
              <Link href="/owner/bookings" className="flex items-center gap-1.5 text-[#c9a961] text-sm font-semibold hover:text-[#9a7b3c] transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-[#c9a961]" />
                </div>
                <p className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] mb-1">No bookings yet</p>
                <p className="text-[#6c757d] text-sm">Bookings for your properties will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-medium">Guest</th>
                      <th className="px-5 py-3 text-left font-medium">Property</th>
                      <th className="px-5 py-3 text-left font-medium">Check-in</th>
                      <th className="px-5 py-3 text-left font-medium">Amount</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-left font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8f9fa]">
                    {recentBookings.map((booking: any) => (
                      <tr key={booking.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#c9a961]/15 flex items-center justify-center text-[#c9a961] font-bold text-xs flex-shrink-0">
                              {booking.guestName?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-medium text-[#1a1a1a] text-xs">{booking.guestName}</p>
                              <p className="text-[#adb5bd] text-xs">{booking.guestEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-[#343a40] text-xs font-medium line-clamp-1">{booking.property?.title}</p>
                          <p className="text-[#adb5bd] text-xs">{booking.property?.city}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[#343a40] text-xs">
                          {formatDate(booking.checkIn, "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#1a1a1a] text-xs">
                          {formatCurrency(Number(booking.totalAmount))}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${bookingStatusPill(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${paymentPill(booking.paymentStatus)}`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* My Properties */}
            <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f8f9fa]">
                <div>
                  <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Overview</p>
                  <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">My Properties</h2>
                </div>
                <Link href="/owner/properties" className="text-[#c9a961] text-xs font-semibold hover:text-[#9a7b3c]">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-[#f8f9fa]">
                {propertiesSerial.slice(0, 4).map((prop: any) => {
                  const propRevenue = prop.bookings
                    .filter((b: any) => b.paymentStatus === "paid")
                    .reduce((s: number, b: any) => s + Number(b.totalAmount), 0);
                  const thumbnail = prop.images?.[0]?.imageUrl;
                  return (
                    <div key={prop.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors">
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0 relative">
                        {thumbnail ? (
                          <Image src={thumbnail} alt={prop.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-4 w-4 text-[#adb5bd]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{prop.title}</p>
                        <p className="text-xs text-[#6c757d]">{prop.bookings.length} bookings · {formatCurrency(propRevenue)}</p>
                      </div>
                      {prop.hasVirtualTour && (
                        <Globe className="h-3.5 w-3.5 text-[#c9a961] flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
                {propertiesSerial.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[#6c757d] text-sm">No properties yet.</p>
                    <Link href="/owner/submit" className="text-[#c9a961] text-sm font-semibold mt-1 inline-block hover:text-[#9a7b3c]">
                      Submit one →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium mb-0.5">Shortcuts</p>
                <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Quick Actions</h2>
              </div>
              <div className="space-y-1.5">
                {[
                  { href: "/owner/submit",      label: "Submit a Property",   icon: PlusCircle },
                  { href: "/owner/bookings",     label: "View All Bookings",   icon: Calendar },
                  { href: "/owner/revenue",      label: "Revenue Report",      icon: TrendingUp },
                  { href: "/owner/tours",        label: "Virtual Tours",       icon: Globe },
                  { href: "/owner/submissions",  label: "My Submissions",      icon: FileText },
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

      </div>
    </div>
  );
}
