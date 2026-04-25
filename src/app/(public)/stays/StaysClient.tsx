"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/property/PropertyCard";
import PanoramaHeader from "@/components/stays/PanoramaHeader";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface Property {
  id: string;
  title: string;
  slug: string;
  city: string;
  propertyType: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  featured: boolean;
  hasVirtualTour: boolean;
  isVerified: boolean;
  verificationLevel: string | null;
  hasPower: boolean;
  hasWater: boolean;
  hasWifi: boolean;
  images: { imageUrl: string; isPrimary: boolean }[];
  reviews: { rating: number }[];
}

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "studio", label: "Studio" },
  { value: "penthouse", label: "Penthouse" },
  { value: "townhouse", label: "Townhouse" },
];

const BEDROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

export default function StaysClient({
  properties,
  filters,
}: {
  properties: Property[];
  filters: Record<string, string>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    property_type: filters.property_type || "",
    min_price: filters.min_price || "",
    max_price: filters.max_price || "",
    bedrooms: filters.bedrooms || "",
    check_in: filters.check_in || "",
    check_out: filters.check_out || "",
    guests: filters.guests || "",
    has_power: filters.has_power || "",
    has_water: filters.has_water || "",
    has_wifi: filters.has_wifi || "",
    verified_only: filters.verified_only || "",
  });

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(localFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/stays?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocalFilters({ property_type: "", min_price: "", max_price: "", bedrooms: "", check_in: "", check_out: "", guests: "", has_power: "", has_water: "", has_wifi: "", verified_only: "" });
    router.push("/stays");
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const getAvgRating = (reviews: { rating: number }[]) => {
    if (!reviews.length) return undefined;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  };

  return (
    <>
      {/* Panoramic 360° Header */}
      <PanoramaHeader />

      {/* Sticky Filter Bar */}
      <div className="sticky top-20 lg:top-28 z-30 bg-white border-b border-[#e9ecef] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date fields */}
            <div className="flex items-center gap-2 bg-[#f8f9fa] rounded-xl px-3 py-2 text-sm">
              <span className="text-[#6c757d] text-xs font-medium">{t("stays_checkin")}</span>
              <input
                type="date"
                value={localFilters.check_in}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setLocalFilters(f => ({ ...f, check_in: e.target.value }))}
                className="bg-transparent text-[#1a1a1a] text-sm focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#f8f9fa] rounded-xl px-3 py-2 text-sm">
              <span className="text-[#6c757d] text-xs font-medium">{t("stays_checkout")}</span>
              <input
                type="date"
                value={localFilters.check_out}
                min={localFilters.check_in || new Date().toISOString().split("T")[0]}
                onChange={(e) => setLocalFilters(f => ({ ...f, check_out: e.target.value }))}
                className="bg-transparent text-[#1a1a1a] text-sm focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#f8f9fa] rounded-xl px-3 py-2 text-sm">
              <span className="text-[#6c757d] text-xs font-medium">{t("stays_guests")}</span>
              <input
                type="number" min={1} max={20}
                value={localFilters.guests}
                onChange={(e) => setLocalFilters(f => ({ ...f, guests: e.target.value }))}
                placeholder="Any"
                className="bg-transparent w-12 text-[#1a1a1a] text-sm focus:outline-none"
              />
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e9ecef] text-sm text-[#343a40] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("stays_more_filters")}
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#c9a961]" />
              )}
            </button>

            <Button onClick={applyFilters} variant="gold" size="sm" className="gap-1.5">
              <Search className="h-3.5 w-3.5" /> {t("stays_search")}
            </Button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-[#6c757d] hover:text-[#c9a961] transition-colors">
                <X className="h-3.5 w-3.5" /> {t("stays_clear")}
              </button>
            )}

            <span className="ml-auto text-sm text-[#6c757d]">
              {properties.length} {properties.length === 1 ? t("stays_found_one") : t("stays_found_many")}
            </span>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="pt-3 border-t border-[#e9ecef] mt-3 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6c757d] mb-1">{t("stays_type")}</label>
                  <select
                    value={localFilters.property_type}
                    onChange={(e) => setLocalFilters(f => ({ ...f, property_type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6c757d] mb-1">{t("stays_min_price")}</label>
                  <input
                    type="number" min={0}
                    value={localFilters.min_price}
                    onChange={(e) => setLocalFilters(f => ({ ...f, min_price: e.target.value }))}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6c757d] mb-1">{t("stays_max_price")}</label>
                  <input
                    type="number" min={0}
                    value={localFilters.max_price}
                    onChange={(e) => setLocalFilters(f => ({ ...f, max_price: e.target.value }))}
                    placeholder="Any"
                    className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6c757d] mb-1">{t("stays_bedrooms")}</label>
                  <select
                    value={localFilters.bedrooms}
                    onChange={(e) => setLocalFilters(f => ({ ...f, bedrooms: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
                  >
                    {BEDROOM_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Infrastructure filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-[#6c757d] self-center">Infrastructure:</span>
                {[
                  { key: "verified_only", label: "✓ Verified Only" },
                  { key: "has_power", label: "⚡ Stable Power" },
                  { key: "has_water", label: "💧 Running Water" },
                  { key: "has_wifi", label: "📶 WiFi Confirmed" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setLocalFilters(f => ({ ...f, [key]: f[key as keyof typeof f] === "true" ? "" : "true" }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${localFilters[key as keyof typeof localFilters] === "true" ? "bg-[#c9a961] border-[#c9a961] text-white" : "bg-white border-[#e9ecef] text-[#6c757d] hover:border-[#c9a961]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-[#c9a961]" />
            </div>
            <h3 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1a1a1a] mb-3">
              {t("stays_no_results")}
            </h3>
            <p className="text-[#6c757d] mb-6">
              {t("stays_no_results_desc")}
            </p>
            <Button onClick={clearFilters} variant="gold">
              {t("stays_clear_filters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p) => {
              const primaryImage = p.images[0]?.imageUrl;
              const rating = getAvgRating(p.reviews);
              return (
                <PropertyCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  slug={p.slug}
                  city={p.city}
                  propertyType={p.propertyType}
                  pricePerNight={Number(p.pricePerNight)}
                  bedrooms={p.bedrooms}
                  bathrooms={Number(p.bathrooms)}
                  maxGuests={p.maxGuests}
                  featured={p.featured}
                  hasVirtualTour={p.hasVirtualTour}
                  isVerified={p.isVerified}
                  hasPower={p.hasPower}
                  hasWater={p.hasWater}
                  hasWifi={p.hasWifi}
                  imageUrl={primaryImage}
                  rating={rating}
                  reviewCount={p.reviews.length}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
