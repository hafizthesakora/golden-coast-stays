"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import { useI18n } from "@/lib/i18n";
import type { Metadata } from "next";

// Demo images mirroring the PHP gallery page structure
const galleryItems = [
  { src: "/images/h1.jpg", alt: "Luxury living room", category: "interior", size: "large" },
  { src: "/images/h2.jpg", alt: "Premium bedroom", category: "interior", size: "medium" },
  { src: "/images/h3.jpg", alt: "Rooftop view", category: "views", size: "medium" },
  { src: "/images/h4.jpg", alt: "Swimming pool", category: "amenities", size: "small" },
  { src: "/images/im1.jpeg", alt: "Property exterior", category: "exterior", size: "small" },
  { src: "/images/im2.jpeg", alt: "Modern kitchen", category: "interior", size: "medium" },
  { src: "/images/im3.jpeg", alt: "Dining area", category: "interior", size: "large" },
  { src: "/images/im4.jpeg", alt: "Master bathroom", category: "interior", size: "small" },
  { src: "/images/img2.jpg", alt: "Property garden", category: "exterior", size: "medium" },
  { src: "/images/img3.png", alt: "Gym and fitness", category: "amenities", size: "small" },
  { src: "/images/kakum.jpeg", alt: "Kakum National Park", category: "views", size: "large" },
  { src: "/images/independence.jpg", alt: "Independence Arch", category: "views", size: "medium" },
  { src: "/images/falls.jpeg", alt: "Wli Waterfalls", category: "views", size: "small" },
  { src: "/images/kakum1.jpeg", alt: "Canopy walkway", category: "views", size: "medium" },
  { src: "/images/kakum2.jpeg", alt: "Nature trail", category: "views", size: "small" },
  { src: "/images/kwameNkruma.jpg", alt: "Accra city view", category: "views", size: "small" },
];

const FILTER_KEYS = [
  { value: "all", labelKey: "gal_filter_all" },
  { value: "interior", labelKey: "gal_filter_interior" },
  { value: "exterior", labelKey: "gal_filter_exterior" },
  { value: "amenities", labelKey: "gal_filter_amenities" },
  { value: "views", labelKey: "gal_filter_views" },
];

export default function GalleryPage() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeFilter === "all" ? galleryItems : galleryItems.filter(i => i.category === activeFilter);

  const prev = () => setLightbox(i => i !== null ? (i === 0 ? filtered.length - 1 : i - 1) : 0);
  const next = () => setLightbox(i => i !== null ? (i === filtered.length - 1 ? 0 : i + 1) : 0);

  return (
    <>
      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/97 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white hover:text-[#c9a961] transition-colors" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={(e) => { e.stopPropagation(); prev(); }}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative w-full max-w-5xl max-h-[80vh] mx-16" onClick={e => e.stopPropagation()}>
            <Image src={filtered[lightbox].src} alt={filtered[lightbox].alt} fill className="object-contain" />
          </div>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={(e) => { e.stopPropagation(); next(); }}>
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-white/70 text-sm mb-1">{filtered[lightbox].alt}</p>
            <p className="text-white/40 text-xs">{lightbox + 1} / {filtered.length}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: "url('/images/h5.jpg')" }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content gcs-container">
          <p className="section-subtitle" style={{ marginBottom: "12px" }}>{t("gal_page_sub")}</p>
          <h1>{t("gal_page_h1")}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "17px", marginBottom: "20px", maxWidth: "520px" }}>
            {t("gal_page_desc")}
          </p>
          <nav className="breadcrumb">
            <a href="/">Home</a><span>/</span><span style={{ color: "rgba(255,255,255,0.8)" }}>Gallery</span>
          </nav>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="sticky top-20 lg:top-28 z-30 bg-white border-b border-[#e9ecef] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 flex-wrap">
          {FILTER_KEYS.map((f) => {
            const count = f.value === "all" ? galleryItems.length : galleryItems.filter(i => i.category === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeFilter === f.value ? "bg-[#1a1a1a] text-white shadow-md" : "bg-[#f8f9fa] text-[#343a40] hover:bg-[#e9ecef]"}`}
              >
                {t(f.labelKey)}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.value ? "bg-[#c9a961] text-[#1a1a1a]" : "bg-[#e9ecef] text-[#6c757d]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Masonry Grid */}
      <AnimateIn>
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
          {filtered.map((item, i) => {
            const spanClass = item.size === "large" ? "col-span-2 row-span-2" : item.size === "medium" ? "col-span-2 row-span-1" : "col-span-1 row-span-1";
            return (
              <div
                key={i}
                className={`${spanClass} relative overflow-hidden rounded-xl cursor-pointer group`}
                onClick={() => setLightbox(i)}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-4">
                  <span className="text-white font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    {item.alt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      </AnimateIn>
    </>
  );
}
