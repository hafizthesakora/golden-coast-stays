export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports | Admin" };

export default async function AdminReportsPage() {
  const now = new Date();

  // 12-month range
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    allBookings,
    statusGroups,
    propertiesRaw,
    ownersRaw,
    totalProperties,
    totalOwners,
    totalGuests,
  ] = await Promise.all([
    // All bookings for revenue calcs + monthly breakdown
    prisma.booking.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: {
        status: true,
        paymentStatus: true,
        totalAmount: true,
        checkIn: true,
        checkOut: true,
        createdAt: true,
        nights: true,
      },
    }),
    // Status breakdown
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    // Top properties by paid revenue
    prisma.property.findMany({
      select: {
        id: true,
        title: true,
        city: true,
        bookings: {
          select: { totalAmount: true, paymentStatus: true, checkIn: true, checkOut: true, status: true },
        },
      },
    }),
    // Owner performance
    prisma.user.findMany({
      where: { role: "owner" },
      select: {
        id: true,
        name: true,
        email: true,
        ownedProperties: {
          select: {
            bookings: {
              select: { totalAmount: true, paymentStatus: true },
            },
          },
        },
      },
    }),
    prisma.property.count(),
    prisma.user.count({ where: { role: "owner" } }),
    prisma.user.count({ where: { role: "user" } }),
  ]);

  // ── Monthly breakdown ─────────────────────────────────────────────────────
  const monthlyMap: Record<string, { revenue: number; bookings: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { revenue: 0, bookings: 0 };
  }
  for (const b of allBookings) {
    if (b.paymentStatus !== "paid") continue;
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += Number(b.totalAmount);
      monthlyMap[key].bookings += 1;
    }
  }
  const monthly = Object.entries(monthlyMap).map(([month, v]) => ({
    month,
    revenue: v.revenue,
    bookings: v.bookings,
  }));

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusColorMap: Record<string, string> = {
    confirmed: "#10b981",
    completed: "#3b82f6",
    pending:   "#f59e0b",
    cancelled: "#ef4444",
  };
  const statusBreakdown = statusGroups.map((g: typeof statusGroups[number]) => ({
    label: g.status,
    count: g._count._all,
    color: statusColorMap[g.status] ?? "#6c757d",
  }));

  // ── Top properties ────────────────────────────────────────────────────────
  type RawProperty = typeof propertiesRaw[number];
  type RawPropertyBooking = RawProperty["bookings"][number];
  type RawOwner = typeof ownersRaw[number];
  type RawOwnerProperty = RawOwner["ownedProperties"][number];
  type RawOwnerBooking = RawOwnerProperty["bookings"][number];

  const topProperties = propertiesRaw
    .map((p: RawProperty) => {
      const paid = p.bookings.filter((b: RawPropertyBooking) => b.paymentStatus === "paid");
      const revenue = paid.reduce((s: number, b: RawPropertyBooking) => s + Number(b.totalAmount), 0);
      const active = p.bookings.filter((b: RawPropertyBooking) => b.status !== "cancelled");
      const nightsBooked = active.reduce((s: number, b: RawPropertyBooking) => {
        const nights = Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000);
        return s + nights;
      }, 0);
      const occupancyRate = Math.min(100, Math.round((nightsBooked / 365) * 100));
      return { title: p.title, city: p.city, bookings: p.bookings.length, revenue, occupancyRate };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ── Owner performance ─────────────────────────────────────────────────────
  const owners = ownersRaw.map((o: RawOwner) => {
    const allB = o.ownedProperties.flatMap((p: RawOwnerProperty) => p.bookings);
    const gross = allB.filter((b: RawOwnerBooking) => b.paymentStatus === "paid").reduce((s: number, b: RawOwnerBooking) => s + Number(b.totalAmount), 0);
    const refunded = allB.filter((b: RawOwnerBooking) => b.paymentStatus === "refunded").reduce((s: number, b: RawOwnerBooking) => s + Number(b.totalAmount), 0);
    return {
      name: o.name ?? "—",
      email: o.email,
      ownerId: o.id,
      properties: o.ownedProperties.length,
      bookings: allB.length,
      grossRevenue: gross,
      netRevenue: gross - refunded,
      refunded,
    };
  }).sort((a, b) => b.netRevenue - a.netRevenue);

  // ── Top guests ────────────────────────────────────────────────────────────
  const guestBookings = await prisma.booking.findMany({
    where: { paymentStatus: "paid" },
    select: {
      totalAmount: true,
      nights: true,
      guestName: true,
      guestEmail: true,
    },
  });
  const guestMap: Record<string, { name: string; email: string; bookings: number; totalSpent: number; totalNights: number }> = {};
  for (const b of guestBookings) {
    const key = b.guestEmail;
    if (!guestMap[key]) guestMap[key] = { name: b.guestName, email: b.guestEmail, bookings: 0, totalSpent: 0, totalNights: 0 };
    guestMap[key].bookings += 1;
    guestMap[key].totalSpent += Number(b.totalAmount);
    guestMap[key].totalNights += b.nights ?? 0;
  }
  const guests = Object.values(guestMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .map((g) => ({ ...g, avgNights: g.bookings > 0 ? g.totalNights / g.bookings : 0 }));

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const allTimeBookings = await prisma.booking.findMany({
    select: { status: true, paymentStatus: true, totalAmount: true, nights: true },
  });
  const grossRevenue = allTimeBookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + Number(b.totalAmount), 0);
  const refundedRevenue = allTimeBookings.filter((b) => b.paymentStatus === "refunded").reduce((s, b) => s + Number(b.totalAmount), 0);
  const netRevenue = grossRevenue - refundedRevenue;
  const totalBookings = allTimeBookings.length;
  const confirmedOrCompleted = allTimeBookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;
  const conversionRate = totalBookings > 0 ? Math.round((confirmedOrCompleted / totalBookings) * 100) : 0;
  const paidBookings = allTimeBookings.filter((b) => b.paymentStatus === "paid");
  const avgBookingValue = paidBookings.length > 0 ? grossRevenue / paidBookings.length : 0;
  const totalNights = allTimeBookings.reduce((s, b) => s + (b.nights ?? 0), 0);
  const avgNights = totalBookings > 0 ? totalNights / totalBookings : 0;

  return (
    <ReportsClient
      monthly={monthly}
      statusBreakdown={statusBreakdown}
      topProperties={topProperties}
      owners={owners}
      guests={guests}
      summary={{
        grossRevenue,
        refundedRevenue,
        netRevenue,
        totalBookings,
        conversionRate,
        avgBookingValue,
        avgNights,
        totalProperties,
        totalOwners,
        totalGuests,
      }}
    />
  );
}
