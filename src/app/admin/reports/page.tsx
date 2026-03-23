export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports | Admin" };

export default async function AdminReportsPage() {
  const now = new Date();
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
    prisma.booking.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { status: true, paymentStatus: true, totalAmount: true, checkIn: true, checkOut: true, createdAt: true, nights: true },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.property.findMany({
      select: {
        id: true, title: true, city: true,
        bookings: { select: { totalAmount: true, paymentStatus: true, checkIn: true, checkOut: true, status: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "owner" },
      select: {
        id: true, name: true, email: true,
        ownedProperties: { select: { bookings: { select: { totalAmount: true, paymentStatus: true } } } },
      },
    }),
    prisma.property.count(),
    prisma.user.count({ where: { role: "owner" } }),
    prisma.user.count({ where: { role: "user" } }),
  ]);

  // derive all types from query results
  type Booking12M       = typeof allBookings[number];
  type StatusGroup      = typeof statusGroups[number];
  type RawProperty      = typeof propertiesRaw[number];
  type RawPropBooking   = RawProperty["bookings"][number];
  type RawOwner         = typeof ownersRaw[number];
  type RawOwnerProp     = RawOwner["ownedProperties"][number];
  type RawOwnerBooking  = RawOwnerProp["bookings"][number];
  type MappedProperty   = { title: string; city: string; bookings: number; revenue: number; occupancyRate: number };
  type MappedOwner      = { name: string; email: string; ownerId: string; properties: number; bookings: number; grossRevenue: number; netRevenue: number; refunded: number };
  type GuestEntry       = { name: string; email: string; bookings: number; totalSpent: number; totalNights: number };

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
  const monthly = Object.entries(monthlyMap).map(([month, v]: [string, { revenue: number; bookings: number }]) => ({
    month,
    revenue: v.revenue,
    bookings: v.bookings,
  }));

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusColorMap: Record<string, string> = {
    confirmed: "#10b981", completed: "#3b82f6", pending: "#f59e0b", cancelled: "#ef4444",
  };
  const statusBreakdown = statusGroups.map((g: StatusGroup) => ({
    label: g.status,
    count: g._count._all,
    color: statusColorMap[g.status] ?? "#6c757d",
  }));

  // ── Top properties ────────────────────────────────────────────────────────
  const topProperties = propertiesRaw
    .map((p: RawProperty) => {
      const paid   = p.bookings.filter((b: RawPropBooking) => b.paymentStatus === "paid");
      const revenue = paid.reduce((s: number, b: RawPropBooking) => s + Number(b.totalAmount), 0);
      const active  = p.bookings.filter((b: RawPropBooking) => b.status !== "cancelled");
      const nightsBooked = active.reduce((s: number, b: RawPropBooking) => {
        const nights = Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000);
        return s + nights;
      }, 0);
      const occupancyRate = Math.min(100, Math.round((nightsBooked / 365) * 100));
      return { title: p.title, city: p.city, bookings: p.bookings.length, revenue, occupancyRate };
    })
    .sort((a: MappedProperty, b: MappedProperty) => b.revenue - a.revenue)
    .slice(0, 10);

  // ── Owner performance ─────────────────────────────────────────────────────
  const owners = ownersRaw
    .map((o: RawOwner) => {
      const allB     = o.ownedProperties.flatMap((p: RawOwnerProp) => p.bookings);
      const gross    = allB.filter((b: RawOwnerBooking) => b.paymentStatus === "paid").reduce((s: number, b: RawOwnerBooking) => s + Number(b.totalAmount), 0);
      const refunded = allB.filter((b: RawOwnerBooking) => b.paymentStatus === "refunded").reduce((s: number, b: RawOwnerBooking) => s + Number(b.totalAmount), 0);
      return { name: o.name ?? "—", email: o.email, ownerId: o.id, properties: o.ownedProperties.length, bookings: allB.length, grossRevenue: gross, netRevenue: gross - refunded, refunded };
    })
    .sort((a: MappedOwner, b: MappedOwner) => b.netRevenue - a.netRevenue);

  // ── Top guests ────────────────────────────────────────────────────────────
  const guestBookings = await prisma.booking.findMany({
    where: { paymentStatus: "paid" },
    select: { totalAmount: true, nights: true, guestName: true, guestEmail: true },
  });
  type GuestBooking = typeof guestBookings[number];
  const guestMap: Record<string, GuestEntry> = {};
  for (const b of guestBookings) {
    const key = b.guestEmail;
    if (!guestMap[key]) guestMap[key] = { name: b.guestName, email: b.guestEmail, bookings: 0, totalSpent: 0, totalNights: 0 };
    guestMap[key].bookings    += 1;
    guestMap[key].totalSpent  += Number(b.totalAmount);
    guestMap[key].totalNights += b.nights ?? 0;
  }
  const guests = Object.values(guestMap)
    .sort((a: GuestEntry, b: GuestEntry) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .map((g: GuestEntry) => ({ ...g, avgNights: g.bookings > 0 ? g.totalNights / g.bookings : 0 }));

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const allTimeBookings = await prisma.booking.findMany({
    select: { status: true, paymentStatus: true, totalAmount: true, nights: true },
  });
  type AllTimeBooking = typeof allTimeBookings[number];
  const grossRevenue     = allTimeBookings.filter((b: AllTimeBooking) => b.paymentStatus === "paid").reduce((s: number, b: AllTimeBooking) => s + Number(b.totalAmount), 0);
  const refundedRevenue  = allTimeBookings.filter((b: AllTimeBooking) => b.paymentStatus === "refunded").reduce((s: number, b: AllTimeBooking) => s + Number(b.totalAmount), 0);
  const netRevenue       = grossRevenue - refundedRevenue;
  const totalBookings    = allTimeBookings.length;
  const confirmedOrCompleted = allTimeBookings.filter((b: AllTimeBooking) => b.status === "confirmed" || b.status === "completed").length;
  const conversionRate   = totalBookings > 0 ? Math.round((confirmedOrCompleted / totalBookings) * 100) : 0;
  const paidBookings     = allTimeBookings.filter((b: AllTimeBooking) => b.paymentStatus === "paid");
  const avgBookingValue  = paidBookings.length > 0 ? grossRevenue / paidBookings.length : 0;
  const totalNights      = allTimeBookings.reduce((s: number, b: AllTimeBooking) => s + (b.nights ?? 0), 0);
  const avgNights        = totalBookings > 0 ? totalNights / totalBookings : 0;

  // suppress unused-var warning for GuestBooking
  void (0 as unknown as GuestBooking);
  void (0 as unknown as Booking12M);

  return (
    <ReportsClient
      monthly={monthly}
      statusBreakdown={statusBreakdown}
      topProperties={topProperties}
      owners={owners}
      guests={guests}
      summary={{ grossRevenue, refundedRevenue, netRevenue, totalBookings, conversionRate, avgBookingValue, avgNights, totalProperties, totalOwners, totalGuests }}
    />
  );
}
