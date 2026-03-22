import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  Home, Calendar, Users, DollarSign, TrendingUp, TrendingDown,
  Clock, ArrowRight, AlertCircle, BarChart2,
  FileText, Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RevenueBarChart, BookingDonut, TopPropertiesBar } from "@/components/admin/DashboardCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard | Golden Coast Stay" };

function monthStart(monthsAgo: number) {
  const d = new Date();
  d.setDate(1); d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function AdminDashboard() {
  const session = await auth();
  const now = new Date();
  const thisMonthStart = monthStart(0);
  const lastMonthStart = monthStart(1);

  const [
    totalProperties, totalBookings, totalUsers,
    pendingBookings, confirmedBookings, cancelledBookings, completedBookings,
    revenue, refundedRevenue, thisMonthRevenue, lastMonthRevenue,
    thisMonthBookings, lastMonthBookings,
    pendingSubmissions,
    recentBookings, topPropertiesRaw, last6MonthsBookings,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.booking.count(),
    prisma.user.count(),
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.count({ where: { status: "cancelled" } }),
    prisma.booking.count({ where: { status: "completed" } }),
    prisma.booking.aggregate({ where: { paymentStatus: "paid" }, _sum: { totalAmount: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: "refunded" }, _sum: { totalAmount: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: "paid", createdAt: { gte: thisMonthStart } }, _sum: { totalAmount: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: "paid", createdAt: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { totalAmount: true } }),
    prisma.booking.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.propertySubmission.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { title: true, city: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.booking.groupBy({
      by: ["propertyId"],
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: monthStart(5) } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.totalAmount || 0);
  const totalRefunded = Number(refundedRevenue._sum.totalAmount || 0);
  const netRevenue = totalRevenue - totalRefunded;
  const thisMonthRev = Number(thisMonthRevenue._sum.totalAmount || 0);
  const lastMonthRev = Number(lastMonthRevenue._sum.totalAmount || 0);
  const revTrend = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : null;
  const bookTrend = lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : null;

  const monthlyMap: Record<string, { revenue: number; bookings: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = monthStart(i);
    monthlyMap[`${d.getFullYear()}-${d.getMonth()}`] = { revenue: 0, bookings: 0 };
  }
  for (const b of last6MonthsBookings) {
    const key = `${b.createdAt.getFullYear()}-${b.createdAt.getMonth()}`;
    if (monthlyMap[key]) {
      monthlyMap[key].bookings += 1;
      if (b.paymentStatus === "paid") monthlyMap[key].revenue += Number(b.totalAmount || 0);
    }
  }
  const monthly = Object.entries(monthlyMap).map(([key, v]) => {
    const [, month] = key.split("-").map(Number);
    return { month: MONTH_LABELS[month], revenue: v.revenue, bookings: v.bookings };
  });

  const statusBreakdown = [
    { label: "Confirmed", count: confirmedBookings, color: "#22c55e" },
    { label: "Pending",   count: pendingBookings,   color: "#f59e0b" },
    { label: "Completed", count: completedBookings, color: "#3b82f6" },
    { label: "Cancelled", count: cancelledBookings, color: "#ef4444" },
  ].filter(s => s.count > 0);

  const propIds = topPropertiesRaw.map(p => p.propertyId);
  const propDetails = propIds.length
    ? await prisma.property.findMany({ where: { id: { in: propIds } }, select: { id: true, title: true } })
    : [];
  const propMap = Object.fromEntries(propDetails.map(p => [p.id, p.title]));
  const topProperties = topPropertiesRaw.map(p => ({
    title: propMap[p.propertyId] ?? "Unknown",
    bookings: p._count.id,
    revenue: Number(p._sum.totalAmount || 0),
  }));

  const statusColors: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
  };
  const payColors: Record<string, string> = {
    paid:    "bg-emerald-100 text-emerald-700",
    unpaid:  "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-600",
    failed:  "bg-red-100 text-red-700",
  };

  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  function TrendBadge({ pct }: { pct: number | null }) {
    if (pct === null) return null;
    const up = pct >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
        {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        {Math.abs(pct).toFixed(1)}%
      </span>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Admin Panel</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">
            {greeting}, {(session as { user?: { name?: string } }).user?.name?.split(" ")[0]}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {(pendingBookings > 0 || (pendingSubmissions as number) > 0) && (
            <Link href="/admin/bookings?status=pending" className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-semibold">
                {pendingBookings} pending
              </span>
            </Link>
          )}
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-[#343a40]">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-[#adb5bd]">{now.getFullYear()}</p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Revenue Hero Card ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Big revenue card */}
          <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#c9a961]/10 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#c9a961]/5 translate-y-8 -translate-x-8" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#c9a961]/20 flex items-center justify-center mb-4">
                <DollarSign className="h-5 w-5 text-[#c9a961]" />
              </div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Net Revenue</p>
              <p className="font-['Playfair_Display'] text-3xl font-bold mb-1">{formatCurrency(netRevenue)}</p>
              <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-xs">Gross paid</p>
                  <p className="text-white/70 text-xs font-medium">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-xs">Refunded</p>
                  <p className="text-red-400 text-xs font-medium">-{formatCurrency(totalRefunded)}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <p className="text-white/40 text-xs">This month</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold text-xs">{formatCurrency(thisMonthRev)}</p>
                    <TrendBadge pct={revTrend} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 smaller KPI cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Total Bookings", value: totalBookings, sub: `${thisMonthBookings} this month`, trend: bookTrend, icon: Calendar, accent: "#3b82f6", bg: "bg-blue-50" },
              { label: "Properties", value: totalProperties, sub: "Active listings", trend: null, icon: Home, accent: "#8b5cf6", bg: "bg-purple-50" },
              { label: "Guests", value: totalUsers, sub: "Registered users", trend: null, icon: Users, accent: "#10b981", bg: "bg-emerald-50" },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className="h-5 w-5" style={{ color: card.accent }} />
                  </div>
                  {card.trend !== null && <TrendBadge pct={card.trend} />}
                </div>
                <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-2xl leading-none mb-1">{card.value}</p>
                <p className="text-[#6c757d] text-xs">{card.label}</p>
                <p className="text-[#adb5bd] text-xs mt-1">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Secondary stats row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending Bookings", value: pendingBookings, href: "/admin/bookings?status=pending", icon: Clock, urgent: pendingBookings > 0, color: "#f59e0b" },
            { label: "Confirmed", value: confirmedBookings, href: "/admin/bookings?status=confirmed", icon: TrendingUp, urgent: false, color: "#22c55e" },
            { label: "Avg. Booking Value", value: formatCurrency(avgBookingValue), href: "/admin/bookings", icon: BarChart2, urgent: false, color: "#c9a961" },
            { label: "Submissions", value: pendingSubmissions as number, href: "/admin/submissions", icon: FileText, urgent: (pendingSubmissions as number) > 0, color: "#8b5cf6" },
          ].map(s => (
            <Link
              key={s.label}
              href={s.href}
              className={`group bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition-all ${s.urgent ? "border-amber-200 bg-amber-50/50" : "border-white/80"}`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1a1a1a] text-lg leading-none">{s.value}</p>
                <p className="text-[#6c757d] text-xs truncate mt-0.5">{s.label}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[#adb5bd] ml-auto group-hover:text-[#c9a961] transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* ── Charts row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium mb-0.5">Revenue Trend</p>
                <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg">Last 6 Months</h2>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#6c757d]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] inline-block" />Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-[#1a1a1a]/15 inline-block" />Bookings
                </span>
              </div>
            </div>
            <RevenueBarChart monthly={monthly} />
          </div>

          <div className="bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium mb-0.5">Overview</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg">Booking Status</h2>
            </div>
            <BookingDonut data={statusBreakdown} />
            <div className="mt-5 pt-4 border-t border-[#f0f0f0] grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#f8f9fa] rounded-xl">
                <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl">
                  {confirmedBookings + completedBookings}
                </p>
                <p className="text-xs text-[#6c757d]">Successful</p>
              </div>
              <div className="text-center p-3 bg-[#f8f9fa] rounded-xl">
                <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl">
                  {totalBookings > 0 ? `${Math.round(((confirmedBookings + completedBookings) / totalBookings) * 100)}%` : "—"}
                </p>
                <p className="text-xs text-[#6c757d]">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row: bookings table + right panel ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
              <div>
                <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Latest</p>
                <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Recent Bookings</h2>
              </div>
              <Link href="/admin/bookings" className="flex items-center gap-1.5 text-[#c9a961] text-sm font-semibold hover:text-[#9a7b3c] transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f8f9fa]">
                    {["Guest", "Property", "Amount", "Status", "Payment"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] text-[#adb5bd] font-semibold uppercase tracking-wider bg-[#fafafa]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f9fa]">
                  {recentBookings.map(b => (
                    <tr key={b.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(b.user?.name?.[0] ?? b.user?.email?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1a1a1a] text-xs truncate">{b.user?.name ?? "Guest"}</p>
                            <p className="text-[#adb5bd] text-xs truncate max-w-[100px]">{b.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[#343a40] text-xs truncate max-w-[120px]">{b.property.title}</p>
                        <p className="text-[#adb5bd] text-xs">{b.property.city}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-[#1a1a1a] text-xs">{formatCurrency(Number(b.totalAmount))}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${payColors[b.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-[#adb5bd] text-sm">No bookings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Top properties + Quick actions */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium mb-0.5">Performance</p>
                  <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Top Properties</h2>
                </div>
                <Link href="/admin/properties"><ArrowRight className="h-4 w-4 text-[#c9a961]" /></Link>
              </div>
              <TopPropertiesBar data={topProperties} />
            </div>

            <div className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium mb-0.5">Shortcuts</p>
                <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Quick Actions</h2>
              </div>
              <div className="space-y-1.5">
                {[
                  { href: "/admin/bookings?status=pending", label: "Review Pending Bookings", badge: pendingBookings, urgent: pendingBookings > 0 },
                  { href: "/admin/submissions", label: "Property Submissions", badge: pendingSubmissions as number, urgent: (pendingSubmissions as number) > 0 },
                  { href: "/admin/properties", label: "All Properties", badge: totalProperties, urgent: false },
                  { href: "/admin/users", label: "User Management", badge: totalUsers, urgent: false },
                  { href: "/admin/tours", label: "Virtual Tours", badge: null, urgent: false },
                  { href: "/admin/settings", label: "Settings", badge: null, urgent: false },
                ].map(a => (
                  <Link key={a.href} href={a.href} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-[#f8f9fa] transition-colors group">
                    <span className="text-sm text-[#343a40] flex-1 font-medium">{a.label}</span>
                    {a.badge !== null && a.badge !== undefined && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.urgent ? "bg-amber-100 text-amber-700" : "bg-[#f0f0f0] text-[#6c757d]"}`}>
                        {a.badge}
                      </span>
                    )}
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
