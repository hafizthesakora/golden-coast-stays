import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Home, Calendar, DollarSign, Clock, ChevronRight,
  Mail, Phone, CheckCircle, FileText, Users,
} from "lucide-react";

export const metadata: Metadata = { title: "Property Owners | Admin" };

export default async function AdminOwnersPage() {
  const owners = await prisma.user.findMany({
    where: { role: "owner" },
    include: {
      ownedProperties: {
        include: {
          bookings: {
            select: { totalAmount: true, paymentStatus: true, status: true, checkIn: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      submissions: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const enriched = owners.map((owner: typeof owners[number]) => {
    const allBookings = owner.ownedProperties.flatMap((p) => p.bookings);
    const paidBookings = allBookings.filter((b) => b.paymentStatus === "paid");
    const refundedBookings = allBookings.filter((b) => b.paymentStatus === "refunded");
    const grossRevenue = paidBookings.reduce((s, b) => s + Number(b.totalAmount), 0);
    const refundedAmount = refundedBookings.reduce((s, b) => s + Number(b.totalAmount), 0);
    const netRevenue = grossRevenue - refundedAmount;
    const upcomingCount = allBookings.filter(
      (b) => new Date(b.checkIn) >= now && b.status !== "cancelled"
    ).length;
    const pendingSubs = owner.submissions.filter((s) => s.status === "pending").length;
    return { ...owner, grossRevenue, netRevenue, refundedAmount, upcomingCount, pendingSubs, bookingCount: allBookings.length };
  });

  const totalOwners = enriched.length;
  const totalProperties = enriched.reduce((s, o) => s + o.ownedProperties.length, 0);
  const totalNetRevenue = enriched.reduce((s, o) => s + o.netRevenue, 0);
  const activeOwners = enriched.filter((o) => o.ownedProperties.length > 0).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Admin Panel</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">Property Owners</h1>
        </div>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e9ecef] text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors"
        >
          All Users <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Summary Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Owners",     value: totalOwners,               icon: Users,      color: "#c9a961" },
            { label: "Active (w/ props)", value: activeOwners,             icon: CheckCircle, color: "#10b981" },
            { label: "Total Properties", value: totalProperties,           icon: Home,        color: "#3b82f6" },
            { label: "Net Revenue (All)", value: formatCurrency(totalNetRevenue), icon: DollarSign, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-white/80 p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1a1a1a] text-lg leading-none truncate">{s.value}</p>
                <p className="text-[#6c757d] text-xs mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Owners List ───────────────────────────────────────────────────── */}
        {enriched.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-16 text-center shadow-sm">
            <Users className="h-12 w-12 text-[#c9a961] mx-auto mb-4" />
            <p className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-2">No owners yet</p>
            <p className="text-[#6c757d] text-sm">Users with the "owner" role will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enriched.map((owner) => (
              <div key={owner.id} className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
                {/* Owner header */}
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#f8f9fa]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#c9a961]/15 flex items-center justify-center text-[#c9a961] font-bold text-sm flex-shrink-0">
                      {(owner.name?.[0] ?? owner.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{owner.name ?? "—"}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#6c757d]">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{owner.email}</span>
                        {owner.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{owner.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {owner.pendingSubs > 0 && (
                      <Link
                        href="/admin/submissions?status=pending"
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium"
                      >
                        <FileText className="h-3 w-3" />
                        {owner.pendingSubs} pending
                      </Link>
                    )}
                    <Link
                      href={`/admin/properties?ownerId=${owner.id}`}
                      className="px-3 py-1.5 rounded-xl border border-[#e9ecef] text-xs font-medium text-[#343a40] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
                    >
                      Properties
                    </Link>
                    <Link
                      href={`/admin/bookings`}
                      className="px-3 py-1.5 rounded-xl border border-[#e9ecef] text-xs font-medium text-[#343a40] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
                    >
                      Bookings
                    </Link>
                  </div>
                </div>

                {/* Revenue stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#f0f0f0] border-b border-[#f8f9fa]">
                  {[
                    { label: "Properties", value: owner.ownedProperties.length, icon: Home, color: "#3b82f6" },
                    { label: "Bookings",    value: owner.bookingCount,          icon: Calendar, color: "#8b5cf6" },
                    { label: "Upcoming",   value: owner.upcomingCount,         icon: Clock,    color: "#f59e0b" },
                    { label: "Net Revenue", value: formatCurrency(owner.netRevenue), icon: DollarSign, color: "#10b981" },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3 flex items-center gap-2">
                      <s.icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: s.color }} />
                      <div>
                        <p className="font-bold text-[#1a1a1a] text-sm">{s.value}</p>
                        <p className="text-[10px] text-[#6c757d]">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenue breakdown (only if any money) */}
                {(owner.grossRevenue > 0 || owner.refundedAmount > 0) && (
                  <div className="px-6 py-2 flex items-center gap-4 text-xs text-[#6c757d] bg-[#fafafa]">
                    <span>Gross: <span className="font-medium text-[#343a40]">{formatCurrency(owner.grossRevenue)}</span></span>
                    {owner.refundedAmount > 0 && (
                      <span>Refunded: <span className="font-medium text-red-500">-{formatCurrency(owner.refundedAmount)}</span></span>
                    )}
                  </div>
                )}

                {/* Properties list */}
                {owner.ownedProperties.length > 0 && (
                  <div className="divide-y divide-[#f8f9fa]">
                    {owner.ownedProperties.slice(0, 3).map((prop) => {
                      const propPaid = prop.bookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + Number(b.totalAmount), 0);
                      return (
                        <div key={prop.id} className="flex items-center justify-between px-6 py-2.5 hover:bg-[#fafafa]">
                          <div className="flex items-center gap-2">
                            <Home className="h-3.5 w-3.5 text-[#adb5bd]" />
                            <div>
                              <p className="text-sm font-medium text-[#1a1a1a]">{prop.title}</p>
                              <p className="text-xs text-[#6c757d]">{prop.city} · <span className="capitalize">{prop.propertyType}</span> · {prop.bookings.length} bookings</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prop.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                              {prop.status}
                            </span>
                            <span className="text-xs font-semibold text-[#1a1a1a]">{formatCurrency(propPaid)}</span>
                            <Link
                              href={`/owner/bookings?propertyId=${prop.id}`}
                              className="text-[#c9a961] hover:text-[#9a7b3c]"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                    {owner.ownedProperties.length > 3 && (
                      <div className="px-6 py-2 text-xs text-[#6c757d]">
                        +{owner.ownedProperties.length - 3} more properties
                      </div>
                    )}
                  </div>
                )}

                {owner.ownedProperties.length === 0 && (
                  <div className="px-6 py-3 text-xs text-[#adb5bd]">No properties assigned yet.</div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
