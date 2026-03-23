export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Home, PlusCircle, Bed, Bath, Users, Star, Globe,
  Calendar, DollarSign, TrendingUp,
} from "lucide-react";

export default async function OwnerPropertiesPage() {
  const session = await auth();
  const userId = (session as { user?: { id?: string } })?.user?.id ?? "";

  const properties = await prisma.property.findMany({
    where: { ownerId: userId },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }], take: 3 },
      bookings: { select: { id: true, totalAmount: true, paymentStatus: true, status: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.status === "available").length;
  const totalBookings = properties.reduce((s, p) => s + p.bookings.length, 0);
  const totalRevenue = properties.reduce(
    (s, p) =>
      s +
      p.bookings
        .filter((b) => b.paymentStatus === "paid")
        .reduce((ss, b) => ss + Number(b.totalAmount), 0),
    0
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      available:    { label: "Available",  cls: "bg-emerald-100 text-emerald-700" },
      booked:       { label: "Booked",     cls: "bg-blue-100 text-blue-700" },
      unavailable:  { label: "Inactive",   cls: "bg-gray-100 text-gray-600" },
      maintenance:  { label: "Maintenance",cls: "bg-amber-100 text-amber-700" },
    };
    return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">My Properties</h1>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#c9a961]/10 text-[#c9a961] text-xs font-semibold">
            {totalProperties} {totalProperties === 1 ? "property" : "properties"}
          </span>
        </div>
        <Link
          href="/owner/submit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> Submit New
        </Link>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Stats Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Properties", value: totalProperties, icon: Home,       color: "#c9a961" },
            { label: "Active",           value: activeProperties, icon: TrendingUp, color: "#10b981" },
            { label: "Total Bookings",   value: totalBookings,   icon: Calendar,    color: "#3b82f6" },
            { label: "Total Revenue",    value: formatCurrency(totalRevenue), icon: DollarSign, color: "#f59e0b" },
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

        {/* ── Properties Grid ───────────────────────────────────────────────── */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-16 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-5">
              <Home className="h-9 w-9 text-[#c9a961]" />
            </div>
            <p className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a] mb-2">No Properties Yet</p>
            <p className="text-[#6c757d] mb-6 max-w-sm mx-auto">
              Submit your first property for review. Once approved, it will appear here with booking and revenue data.
            </p>
            <Link
              href="/owner/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Submit a Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {properties.map((property) => {
              const thumbnail = property.images[0]?.imageUrl;
              const paidBookings = property.bookings.filter((b) => b.paymentStatus === "paid");
              const propertyRevenue = paidBookings.reduce((s, b) => s + Number(b.totalAmount), 0);
              const avgRating =
                property.reviews.length > 0
                  ? property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length
                  : null;
              const badge = statusBadge(property.status);

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-[#f0f0f0]">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={property.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-10 w-10 text-[#d0d0d0]" />
                      </div>
                    )}
                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {/* Virtual tour badge */}
                    {property.hasVirtualTour && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#c9a961] text-white font-semibold">
                        <Globe className="h-3 w-3" /> 360°
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-base leading-tight line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-[#6c757d] text-xs mt-0.5">
                        {property.city} · <span className="capitalize">{property.propertyType}</span>
                      </p>
                    </div>

                    {/* Specs row */}
                    <div className="flex items-center gap-3 text-xs text-[#6c757d] mb-4">
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> {Number(property.bedrooms)} bed
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {Number(property.bathrooms)} bath
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {Number(property.maxGuests)} guests
                      </span>
                    </div>

                    {/* Revenue & ratings */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#f8f9fa] rounded-xl p-3">
                        <p className="text-[#6c757d] text-xs mb-0.5">Revenue</p>
                        <p className="font-bold text-[#1a1a1a] text-sm">{formatCurrency(propertyRevenue)}</p>
                        <p className="text-[#adb5bd] text-xs">{paidBookings.length} paid</p>
                      </div>
                      <div className="bg-[#f8f9fa] rounded-xl p-3">
                        <p className="text-[#6c757d] text-xs mb-0.5">Rating</p>
                        {avgRating !== null ? (
                          <>
                            <p className="font-bold text-[#1a1a1a] text-sm flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-[#c9a961] fill-[#c9a961]" />
                              {avgRating.toFixed(1)}
                            </p>
                            <p className="text-[#adb5bd] text-xs">{property.reviews.length} reviews</p>
                          </>
                        ) : (
                          <p className="text-[#adb5bd] text-xs mt-1">No reviews yet</p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                      <p className="text-[#1a1a1a] font-semibold text-sm">
                        {formatCurrency(Number(property.pricePerNight))}
                        <span className="text-[#adb5bd] font-normal text-xs"> /night</span>
                      </p>
                      <Link
                        href={`/owner/bookings?propertyId=${property.id}`}
                        className="flex items-center gap-1.5 text-xs text-[#c9a961] font-semibold hover:text-[#9a7b3c] transition-colors"
                      >
                        View Bookings <Calendar className="h-3.5 w-3.5" />
                      </Link>
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
