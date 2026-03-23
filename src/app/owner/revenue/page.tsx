export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, serialize } from "@/lib/utils";
import { DollarSign, TrendingUp, Calendar, CheckCircle, BarChart2 } from "lucide-react";
import { RevenueBarChart, BookingDonut } from "@/components/admin/DashboardCharts";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthStart(monthsAgo: number) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

export default async function OwnerRevenuePage() {
  const session = await auth();
  const userId = (session as { user?: { id?: string } })?.user?.id ?? "";

  const [allBookings, last6MonthsData, properties] = await Promise.all([
    prisma.booking.findMany({
      where: { property: { ownerId: userId }, paymentStatus: "paid" },
      select: { totalAmount: true, createdAt: true, propertyId: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { property: { ownerId: userId }, createdAt: { gte: monthStart(5) } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true, status: true, propertyId: true },
    }),
    prisma.property.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        bookings: { select: { totalAmount: true, paymentStatus: true, id: true } },
      },
    }),
  ]);

  // ── KPI calculations ──────────────────────────────────────────────────────
  type AllBooking = typeof allBookings[number];
  type Last6Booking = typeof last6MonthsData[number];
  type StatusItem = { label: string; count: number; color: string };

  const totalEarned = allBookings.reduce((s: number, b: AllBooking) => s + Number(b.totalAmount), 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = allBookings
    .filter((b: AllBooking) => new Date(b.createdAt) >= thisMonthStart)
    .reduce((s: number, b: AllBooking) => s + Number(b.totalAmount), 0);

  const avgPerBooking = allBookings.length > 0 ? totalEarned / allBookings.length : 0;
  const paidBookingsCount = allBookings.length;

  // ── Monthly chart data ────────────────────────────────────────────────────
  const monthly: { month: string; revenue: number; bookings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = monthStart(i);
    const end = i === 0
      ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
      : monthStart(i - 1);
    const slice = last6MonthsData.filter(
      (b: Last6Booking) => new Date(b.createdAt) >= start && new Date(b.createdAt) < end
    );
    monthly.push({
      month: MONTH_LABELS[start.getMonth()],
      revenue: slice
        .filter((b: Last6Booking) => b.paymentStatus === "paid")
        .reduce((s: number, b: Last6Booking) => s + Number(b.totalAmount), 0),
      bookings: slice.length,
    });
  }

  // ── Booking status donut ──────────────────────────────────────────────────
  const statusBreakdown = [
    { label: "Confirmed", count: last6MonthsData.filter((b: Last6Booking) => b.status === "confirmed").length, color: "#10b981" },
    { label: "Pending",   count: last6MonthsData.filter((b: Last6Booking) => b.status === "pending").length,   color: "#f59e0b" },
    { label: "Completed", count: last6MonthsData.filter((b: Last6Booking) => b.status === "completed").length, color: "#3b82f6" },
    { label: "Cancelled", count: last6MonthsData.filter((b: Last6Booking) => b.status === "cancelled").length, color: "#ef4444" },
  ].filter((s: StatusItem) => s.count > 0);

  // ── Property revenue breakdown ────────────────────────────────────────────
  type RevProperty = typeof properties[number];
  type RevBooking = RevProperty["bookings"][number];

  type PropBreakdown = { id: string; title: string; bookingCount: number; paidCount: number; revenue: number; pct: number };

  const propertyBreakdown = properties
    .map((p: RevProperty) => {
      const paidBookings = p.bookings.filter((b: RevBooking) => b.paymentStatus === "paid");
      const revenue = paidBookings.reduce((s: number, b: RevBooking) => s + Number(b.totalAmount), 0);
      return {
        id: p.id,
        title: p.title,
        bookingCount: p.bookings.length,
        paidCount: paidBookings.length,
        revenue,
        pct: totalEarned > 0 ? (revenue / totalEarned) * 100 : 0,
      };
    })
    .sort((a: PropBreakdown, b: PropBreakdown) => b.revenue - a.revenue);

  // ── Recent paid transactions ───────────────────────────────────────────────
  const recentTransactions = serialize(
    allBookings.slice(0, 20).map((b: AllBooking) => {
      const prop = properties.find((p: RevProperty) => p.id === b.propertyId);
      return { ...b, propertyTitle: prop?.title ?? "Unknown Property" };
    })
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">Revenue & Earnings</h1>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-medium text-[#343a40]">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-xs text-[#adb5bd]">Payments processed via Bizify</p>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Stats Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Dark hero card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#c9a961]/10 -translate-y-8 translate-x-8" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#c9a961]/20 flex items-center justify-center mb-4">
                <DollarSign className="h-5 w-5 text-[#c9a961]" />
              </div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Total Earned</p>
              <p className="font-['Playfair_Display'] text-3xl font-bold mb-1">
                {formatCurrency(totalEarned)}
              </p>
              <p className="text-white/40 text-xs mt-3 pt-3 border-t border-white/10">
                All time · via Bizify
              </p>
            </div>
          </div>

          {[
            {
              label: "This Month",
              value: formatCurrency(thisMonthRevenue),
              sub: "Current month earnings",
              icon: Calendar,
              color: "#3b82f6",
              bg: "bg-blue-50",
            },
            {
              label: "Avg per Booking",
              value: formatCurrency(Math.round(avgPerBooking)),
              sub: "Average booking value",
              icon: TrendingUp,
              color: "#c9a961",
              bg: "bg-amber-50",
            },
            {
              label: "Paid Bookings",
              value: paidBookingsCount,
              sub: "Total completed payments",
              icon: CheckCircle,
              color: "#10b981",
              bg: "bg-emerald-50",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
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

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f8f9fa]">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Last 6 Months</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Revenue Trend</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-4 mb-4 text-xs text-[#6c757d]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#c9a961] to-[#9a7b3c] inline-block" />
                  Revenue (GHS)
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
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Last 6 Months</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Booking Status</h2>
            </div>
            <div className="px-6 py-6">
              <BookingDonut data={statusBreakdown} />
            </div>
          </div>
        </div>

        {/* ── Property Revenue Breakdown ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f8f9fa]">
            <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">By Property</p>
            <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Revenue Breakdown</h2>
          </div>
          {propertyBreakdown.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart2 className="h-10 w-10 text-[#e0e0e0] mx-auto mb-3" />
              <p className="text-[#6c757d] text-sm">No revenue data yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider border-b border-[#f0f0f0]">
                    <th className="px-6 py-3.5 text-left font-medium">Property</th>
                    <th className="px-6 py-3.5 text-left font-medium">Total Bookings</th>
                    <th className="px-6 py-3.5 text-left font-medium">Paid Bookings</th>
                    <th className="px-6 py-3.5 text-left font-medium">Revenue</th>
                    <th className="px-6 py-3.5 text-left font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f9fa]">
                  {propertyBreakdown.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1a1a1a]">{p.title}</td>
                      <td className="px-6 py-4 text-[#343a40]">{p.bookingCount}</td>
                      <td className="px-6 py-4 text-[#343a40]">{p.paidCount}</td>
                      <td className="px-6 py-4 font-semibold text-[#1a1a1a]">{formatCurrency(p.revenue)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#c9a961] to-[#9a7b3c]"
                              style={{ width: `${p.pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#6c757d]">{p.pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent Transactions ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f8f9fa]">
            <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Paid via Bizify</p>
            <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Recent Transactions</h2>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DollarSign className="h-10 w-10 text-[#e0e0e0] mx-auto mb-3" />
              <p className="text-[#6c757d] text-sm">No paid transactions yet.</p>
              <p className="text-[#adb5bd] text-xs mt-1">Once guests pay via Bizify, transactions will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider border-b border-[#f0f0f0]">
                    <th className="px-6 py-3.5 text-left font-medium">Date</th>
                    <th className="px-6 py-3.5 text-left font-medium">Property</th>
                    <th className="px-6 py-3.5 text-left font-medium">Amount</th>
                    <th className="px-6 py-3.5 text-left font-medium">Processor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f9fa]">
                  {recentTransactions.map((tx: any) => (
                    <tr key={tx.createdAt + tx.propertyId} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-4 text-[#343a40] text-xs">{formatDate(tx.createdAt, "MMM d, yyyy")}</td>
                      <td className="px-6 py-4 font-medium text-[#1a1a1a]">{tx.propertyTitle}</td>
                      <td className="px-6 py-4 font-semibold text-[#1a1a1a]">{formatCurrency(Number(tx.totalAmount))}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          Bizify ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
