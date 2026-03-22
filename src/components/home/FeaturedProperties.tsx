"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, BedDouble, Bath, Users, Heart, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AnimateIn from "@/components/ui/AnimateIn";
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
  images: { imageUrl: string; isPrimary: boolean }[];
}

export default function FeaturedProperties({ properties }: { properties: Property[] }) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateButtons, { passive: true });
    updateButtons();
    return () => el.removeEventListener("scroll", updateButtons);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".prop-card") as HTMLElement;
    const amount = card ? card.offsetWidth + 30 : 380;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  if (!properties.length) return null;

  return (
    <section className="gcs-section" style={{ background: "var(--off-white)" }}>
      <div className="gcs-container">
        <AnimateIn>
        <div className="section-header">
          <p className="section-subtitle">{t("feat_sub")}</p>
          <h2 className="section-title">{t("feat_h2")}</h2>
          <p className="section-description">{t("feat_desc")}</p>
        </div>
        </AnimateIn>

        <div style={{ position: "relative" }}>
          {/* Prev button */}
          <button
            className="carousel-btn"
            onClick={() => scroll("left")}
            disabled={!canPrev}
            style={{
              position: "absolute", left: "-28px", top: "50%", transform: "translateY(-50%)",
              zIndex: 10, opacity: canPrev ? 1 : 0.35,
            }}
          >
            <ChevronLeft style={{ width: "20px", height: "20px" }} />
          </button>

          <div
            ref={trackRef}
            style={{
              display: "flex",
              gap: "30px",
              overflowX: "auto",
              scrollbarWidth: "none",
              scrollSnapType: "x mandatory",
              paddingBottom: "10px",
              cursor: "grab",
            }}
          >
            {properties.map((p) => {
              const img = p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "/images/h1.jpg";
              return (
                <Link
                  key={p.id}
                  href={`/stays/${p.slug}`}
                  className="prop-card"
                  style={{
                    flex: "0 0 calc(33.333% - 20px)",
                    minWidth: "320px",
                    scrollSnapAlign: "start",
                    background: "var(--white)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)",
                    transition: "var(--transition-medium)",
                    display: "block",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-10px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", height: "260px", overflow: "hidden" }}>
                    <Image
                      src={img}
                      alt={p.title}
                      fill
                      className="prop-img"
                      style={{ objectFit: "cover", transition: "var(--transition-slow)" }}
                    />
                    {p.featured && (
                      <span style={{
                        position: "absolute", top: "20px", left: "20px",
                        background: "#9a7b3c", color: "white",
                        padding: "6px 16px", borderRadius: "var(--radius-full)",
                        fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px",
                      }}>
                        Featured
                      </span>
                    )}
                    <button
                      onClick={(e) => e.preventDefault()}
                      style={{
                        position: "absolute", top: "20px", right: "20px",
                        width: "40px", height: "40px", background: "white",
                        borderRadius: "50%", display: "flex", alignItems: "center",
                        justifyContent: "center", border: "none", cursor: "pointer",
                      }}
                    >
                      <Heart style={{ width: "18px", height: "18px", color: "var(--gold-primary)" }} />
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--medium-gray)", marginBottom: "8px" }}>
                      <MapPin style={{ width: "13px", height: "13px", color: "var(--gold-primary)" }} />
                      <span>{p.city}, Ghana</span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "19px", marginBottom: "14px", color: "var(--black)" }}>
                      {p.title}
                    </h3>
                    <div style={{
                      display: "flex", gap: "16px",
                      padding: "12px 0", borderTop: "1px solid var(--light-gray)",
                      borderBottom: "1px solid var(--light-gray)", marginBottom: "14px",
                    }}>
                      {[
                        { icon: <BedDouble style={{ width: "13px", height: "13px", color: "var(--gold-primary)" }} />, label: `${p.bedrooms} Beds` },
                        { icon: <Bath style={{ width: "13px", height: "13px", color: "var(--gold-primary)" }} />, label: `${p.bathrooms} Bath` },
                        { icon: <Users style={{ width: "13px", height: "13px", color: "var(--gold-primary)" }} />, label: `${p.maxGuests} Guests` },
                      ].map((f) => (
                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--medium-gray)" }}>
                          {f.icon}<span>{f.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: "var(--gold-primary)" }}>
                          {formatCurrency(p.pricePerNight)}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--medium-gray)", marginLeft: "4px" }}>/ night</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Star style={{ width: "13px", height: "13px", color: "var(--gold-primary)", fill: "var(--gold-primary)" }} />
                        <span style={{ fontWeight: 600, color: "var(--dark-gray)", fontSize: "13px" }}>4.9</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Next button */}
          <button
            className="carousel-btn"
            onClick={() => scroll("right")}
            disabled={!canNext}
            style={{
              position: "absolute", right: "-28px", top: "50%", transform: "translateY(-50%)",
              zIndex: 10, opacity: canNext ? 1 : 0.35,
            }}
          >
            <ChevronRight style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/stays" className="btn btn-outline">
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
