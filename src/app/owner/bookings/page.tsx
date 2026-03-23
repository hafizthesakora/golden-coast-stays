export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import {
  Calendar, CheckCircle, Clock, DollarSign, Users,
  ChevronRight, AlertCircle,
} from "lucide-react";

export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; status?: string; checkInFrom?: string; checkInTo?: string }>;
}) {
  const session = await auth();
  const userId = (session as { user?: { id?: string } })?.user?.id ?? "";
  const { propertyId, status, checkInFrom, checkInTo } = await searchParams;

  // Auto-complete past confirmed bookings so they don't stay "confirmed" forever
  await prisma.booking.updateMany({
    where: {
      property: { ownerId: userId },
      status: "confirmed",
      checkOut: { lt: new Date() },
    },
    data: { status: "completed" },
  });

  const dateRangeFilter: Prisma.BookingWhereInput =
    checkInFrom || checkInTo
      ? {
          checkIn: {
            ...(checkInFrom ? { gte: new Date(checkInFrom) } : {}),
            ...(checkInTo ? { lte: new Date(checkInTo + "T23:59:59") } : {}),
          },
        }
      : {};

  const bookingWhere: Prisma.BookingWhereInput = {
    property: { ownerId: userId },
    ...(propertyId ? { propertyId } : {}),
    ...(status ? { status: status as Prisma.EnumBookingStatusFilter } : {}),
    ...dateRangeFilter,
  };

  const [bookings, properties] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        property: {
          select: { title: true, city: true, slug: true, images: { take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  // ── Stats ────────────────────────────────────────────────────────────────
  type OwnerBooking = typeof bookings[number];
  const totalRevenue = bookings
    .filter((b: OwnerBooking) => b.paymentStatus === "paid")
    .reduce((s: number, b: OwnerBooking) => s + Number(b.totalAmount), 0);

  const confirmedCount  = bookings.filter((b: OwnerBooking) => b.status === "confirmed").length;
  const pendingCount    = bookings.filter((b: OwnerBooking) => b.status === "pending").length;
  const completedCount  = bookings.filter((b: OwnerBooking) => b.status === "completed").length;
  const cancelledCount  = bookings.filter((b: OwnerBooking) => b.status === "cancelled").length;

  const bookingStatusPill = (s: string) => {
    const map: Record<string, string> = {
      confirmed: "bg-emerald-100 text-emerald-700",
      pending:   "bg-amber-100 text-amber-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return map[s] ?? "bg-gray-100 text-gray-600";
  };

  const paymentPill = (s: string) => {
    const map: Record<string, string> = {
      paid:     "bg-emerald-100 text-emerald-700",
      pending:  "bg-amber-100 text-amber-700",
      failed:   "bg-red-100 text-red-700",
      refunded: "bg-purple-100 text-purple-700",
    };
    return map[s] ?? "bg-gray-100 text-gray-600";
  };

  const statusTabs = [
    { label: "All",       value: "",            count: bookings.length },
    { label: "Confirmed", value: "confirmed",   count: confirmedCount },
    { label: "Pending",   value: "pending",     count: pendingCount },
    { label: "Completed", value: "completed",   count: completedCount },
    { label: "Cancelled", value: "cancelled",   count: cancelledCount },
  ];

  const buildHref = (overrides: { status?: string; propertyId?: string; checkInFrom?: string; checkInTo?: string } = {}) => {
    const params = new URLSearchParams();
    const pid  = overrides.propertyId  !== undefined ? overrides.propertyId  : (propertyId  ?? "");
    const st   = overrides.status      !== undefined ? overrides.status      : (status       ?? "");
    const from = overrides.checkInFrom !== undefined ? overrides.checkInFrom : (checkInFrom  ?? "");
    const to   = overrides.checkInTo   !== undefined ? overrides.checkInTo   : (checkInTo    ?? "");
    if (pid)  params.set("propertyId", pid);
    if (st)   params.set("status", st);
    if (from) params.set("checkInFrom", from);
    if (to)   params.set("checkInTo", to);
    return `/owner/bookings${params.toString() ? "?" + params.toString() : ""}`;
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">Bookings</h1>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#c9a961]/10 text-[#c9a961] text-xs font-semibold">
            {bookings.length} total
          </span>
        </div>
        <Link
          href="/owner/properties"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e9ecef] text-[#343a40] text-sm font-medium hover:bg-[#f8f9fa] transition-colors"
        >
          My Properties <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Overview Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bookings",  value: bookings.length, icon: Calendar,      color: "#3b82f6" },
            { label: "Confirmed",       value: confirmedCount,  icon: CheckCircle,   color: "#10b981" },
            { label: "Pending",         value: pendingCount,    icon: Clock,         color: "#f59e0b" },
            { label: "Revenue (Paid)",  value: formatCurrency(totalRevenue), icon: DollarSign, color: "#c9a961" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-white/80 p-4 flex items-center gap-3 shadow-sm">
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

        {/* ── Filters ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 p-4 shadow-sm space-y-4">
          {/* Property selector */}
          <div className="flex items-start gap-2">
            <label className="text-xs font-medium text-[#6c757d] whitespace-nowrap pt-1.5">Property:</label>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={buildHref({ propertyId: "" })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !propertyId
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "bg-white text-[#343a40] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"
                }`}
              >
                All Properties
              </Link>
              {properties.map((p) => (
                <Link
                  key={p.id}
                  href={buildHref({ propertyId: p.id })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    propertyId === p.id
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "bg-white text-[#343a40] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"
                  }`}
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <form method="GET" action="/owner/bookings" className="flex flex-wrap items-end gap-3 border-t border-[#f0f0f0] pt-4">
            {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
            {status && <input type="hidden" name="status" value={status} />}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6c757d]">Check-in from</label>
              <input
                type="date"
                name="checkInFrom"
                defaultValue={checkInFrom ?? ""}
                className="h-9 px-3 rounded-xl border border-[#e9ecef] text-xs text-[#343a40] focus:outline-none focus:border-[#c9a961]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6c757d]">Check-in to</label>
              <input
                type="date"
                name="checkInTo"
                defaultValue={checkInTo ?? ""}
                className="h-9 px-3 rounded-xl border border-[#e9ecef] text-xs text-[#343a40] focus:outline-none focus:border-[#c9a961]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#333] transition-colors"
            >
              Apply
            </button>
            {(checkInFrom || checkInTo) && (
              <Link
                href={buildHref({ checkInFrom: "", checkInTo: "" })}
                className="h-9 px-4 rounded-xl border border-[#e9ecef] text-xs text-[#6c757d] hover:text-[#c9a961] hover:border-[#c9a961] transition-colors flex items-center"
              >
                Clear dates
              </Link>
            )}
          </form>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value}
              href={buildHref({ status: tab.value })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                (status ?? "") === tab.value
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "bg-white text-[#343a40] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${(status ?? "") === tab.value ? "bg-white/20 text-white" : "bg-[#f0f0f0] text-[#6c757d]"}`}>
                {tab.count}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Bookings Table ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm">
          {bookings.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-9 w-9 text-[#c9a961]" />
              </div>
              <p className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a] mb-2">No Bookings Found</p>
              <p className="text-[#6c757d] max-w-sm mx-auto">
                {status
                  ? `No ${status} bookings match your current filter.`
                  : propertyId
                  ? "This property has no bookings yet."
                  : "Your properties have not received any bookings yet."}
              </p>
              {(status || propertyId) && (
                <Link
                  href="/owner/bookings"
                  className="mt-4 inline-flex items-center gap-2 text-[#c9a961] text-sm font-semibold hover:text-[#9a7b3c]"
                >
                  Clear filters → View all bookings
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider border-b border-[#f0f0f0]">
                    <th className="px-5 py-3.5 text-left font-medium">Guest</th>
                    <th className="px-5 py-3.5 text-left font-medium">Property</th>
                    <th className="px-5 py-3.5 text-left font-medium">Dates</th>
                    <th className="px-5 py-3.5 text-left font-medium">Nights / Guests</th>
                    <th className="px-5 py-3.5 text-left font-medium">Amount</th>
                    <th className="px-5 py-3.5 text-left font-medium">Status</th>
                    <th className="px-5 py-3.5 text-left font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f9fa]">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#fafafa] transition-colors">
                      {/* Guest */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#c9a961]/15 flex items-center justify-center text-[#c9a961] font-bold text-xs flex-shrink-0">
                            {(booking.guestName?.charAt(0) ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#1a1a1a] text-xs">{booking.guestName}</p>
                            <p className="text-[#adb5bd] text-xs">{booking.guestEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-5 py-4">
                        <p className="text-[#343a40] text-xs font-medium line-clamp-1">{booking.property?.title}</p>
                        <p className="text-[#adb5bd] text-xs">{booking.property?.city}</p>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-xs text-[#343a40]">
                        <p>{formatDate(booking.checkIn, "MMM d, yyyy")}</p>
                        <p className="text-[#adb5bd]">→ {formatDate(booking.checkOut, "MMM d, yyyy")}</p>
                      </td>

                      {/* Nights / Guests */}
                      <td className="px-5 py-4 text-xs text-[#343a40]">
                        <p className="font-medium">{booking.nights} nights</p>
                        <p className="text-[#adb5bd] flex items-center gap-1">
                          <Users className="h-3 w-3" /> {booking.guests} guests
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#1a1a1a] text-sm">{formatCurrency(Number(booking.totalAmount))}</p>
                        <p className="text-[#adb5bd] text-xs">ref: {booking.reference}</p>
                      </td>

                      {/* Booking Status */}
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${bookingStatusPill(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${paymentPill(booking.paymentStatus)}`}>
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

      </div>
    </div>
  );
}
