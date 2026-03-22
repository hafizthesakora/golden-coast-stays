"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Bath, Users, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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
  virtualTourUrl: string | null;
  images: { imageUrl: string }[];
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  if (url.includes("matterport.com")) return url;
  if (url.startsWith("http")) return url;
  return null;
}

export default function VirtualToursClient({ properties }: { properties: Property[] }) {
  const [heroSlide, setHeroSlide] = useState(0);
  const [previewProp, setPreviewProp] = useState<Property | null>(null);
  const heroImages = ["/images/h1.jpg", "/images/h2.jpg", "/images/h3.jpg"];

  // Only show properties that have a usable embed URL
  const tourProperties = properties.filter((p) => p.virtualTourUrl && toEmbedUrl(p.virtualTourUrl));

  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  return (
    <>
      {/* ── HERO ── */}
      <div style={{
        position: "relative", height: "100vh", minHeight: "700px",
        background: "#0a0a0f", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {heroImages.map((src, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              opacity: heroSlide === i ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{
                width: "100%", height: "100%", objectFit: "cover",
                animation: heroSlide === i ? "kenBurns 20s ease-out forwards" : "none",
              }} />
            </div>
          ))}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(10,10,15,0.85) 100%)" }} />
          <div style={{ position: "absolute", top: "20%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,97,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,97,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "900px", padding: "0 20px" }}>
          <div style={{
            display: "inline-block", background: "rgba(201,169,97,0.15)",
            border: "1px solid rgba(201,169,97,0.4)", borderRadius: "50px",
            padding: "6px 20px", marginBottom: "24px",
            fontSize: "12px", fontWeight: 600, letterSpacing: "3px",
            color: "var(--gold-primary)", textTransform: "uppercase",
          }}>
            immersive_experience
          </div>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 800,
            background: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: "20px", letterSpacing: "2px",
            animation: "fadeInUp 1s ease",
          }}>
            Virtual Tours
          </h1>
          <p style={{ fontSize: "20px", fontStyle: "italic", color: "var(--gold-light)", marginBottom: "16px", animation: "fadeInUp 1s ease 0.3s both" }}>
            Explore our properties in 360°
          </p>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.75)", marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.8, animation: "fadeInUp 1s ease 0.6s both" }}>
            Step inside every room, every view, and every detail of our premium Accra properties from anywhere in the world.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", animation: "fadeInUp 1s ease 0.9s both" }}>
            <a href="#tours" className="btn btn-primary">Start Exploring</a>
            <Link href="/stays" className="btn" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}>
              Browse All Stays
            </Link>
          </div>
        </div>

        {/* Slide indicators */}
        <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", zIndex: 3 }}>
          {heroImages.map((_, i) => (
            <button key={i} onClick={() => setHeroSlide(i)} style={{
              width: "60px", height: "4px", borderRadius: "4px", border: "none", cursor: "pointer",
              background: heroSlide === i ? "var(--gold-primary)" : "rgba(255,255,255,0.3)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        <div style={{ position: "absolute", bottom: "80px", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.4)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontSize: "11px", letterSpacing: "2px" }}>
          <span>SCROLL</span>
          <ChevronDown size={16} style={{ animation: "bounce 2s infinite" }} />
        </div>
      </div>

      {/* ── MARQUEE ── */}
      <div style={{ background: "var(--gold-dark)", padding: "14px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: "60px", animation: "marquee 20s linear infinite", whiteSpace: "nowrap" }}>
          {["VR Compatible", "Full 360° View", "Mobile Friendly", "HD Quality", "VR Compatible", "Full 360° View", "Mobile Friendly", "HD Quality", "VR Compatible", "Full 360° View", "Mobile Friendly", "HD Quality"].map((t, i) => (
            <span key={i} style={{ color: "white", fontWeight: 600, fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase", flexShrink: 0 }}>
              · {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── TOURS GRID ── */}
      <div id="tours" className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-[3px] uppercase text-[#c9a961] mb-3">Interactive Experience</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4">
              Explore Our Properties
            </h2>
            <p className="text-[#6c757d] max-w-xl mx-auto">
              Browse each property and step inside with an embedded tour. No download required.
            </p>
          </div>

          {tourProperties.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow">
                <span className="text-4xl">🥽</span>
              </div>
              <h3 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1a1a1a] mb-3">
                No Virtual Tours Available Yet
              </h3>
              <p className="text-[#6c757d] mb-8 max-w-sm mx-auto">
                We are adding 360° tours to our properties. Check back soon or browse all stays.
              </p>
              <Link href="/stays">
                <Button variant="gold">Browse All Stays</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {tourProperties.map((property) => {
                const embedUrl = toEmbedUrl(property.virtualTourUrl!)!;
                return (
                  <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-[#e9ecef] overflow-hidden">
                    {/* Property header */}
                    <div className="flex flex-col sm:flex-row gap-6 p-6 border-b border-[#e9ecef]">
                      <div className="relative w-full sm:w-40 h-40 sm:h-28 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={property.images[0]?.imageUrl || "/images/h1.jpg"}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="gold" className="capitalize text-xs">{property.propertyType}</Badge>
                          <Badge variant="info" className="text-xs">360° Tour</Badge>
                        </div>
                        <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a] mb-1 truncate">
                          {property.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#6c757d] mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#c9a961]" />{property.city}, Ghana
                          </span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5 text-[#c9a961]" />{property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5 text-[#c9a961]" />{Number(property.bathrooms)} bath
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-[#c9a961]" />Up to {property.maxGuests}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="font-['Playfair_Display'] text-lg font-bold text-[#1a1a1a]">
                              {formatCurrency(Number(property.pricePerNight))}
                            </span>
                            <span className="text-xs text-[#6c757d] ml-1">/ night</span>
                          </div>
                          <Link href={`/stays/${property.slug}`}>
                            <Button variant="gold" size="sm">View & Book</Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Preview button */}
                    <div className="px-6 pb-6">
                      <button
                        onClick={() => setPreviewProp(property)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#c9a961] hover:bg-[#b8943f] text-white font-semibold text-sm transition-colors"
                      >
                        <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Preview 360° Tour
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background: "#141419", padding: "80px 0" }}>
        <div className="gcs-container">
          <div className="section-header">
            <p className="section-subtitle">Simple Process</p>
            <h2 style={{ fontFamily: "var(--font-heading)", color: "white" }}>How Virtual Tours Work</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "30px" }}>
            {[
              { step: "01", title: "Choose a Property", desc: "Browse our collection and select the property you want to explore." },
              { step: "02", title: "Enter the Tour", desc: "The embedded 360° or video tour loads directly on the page — no app needed." },
              { step: "03", title: "Explore & Book", desc: "Explore every detail, then click View & Book to reserve your favourite stay." },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center", padding: "40px 30px" }}>
                <div style={{
                  fontFamily: "var(--font-heading)", fontSize: "56px", fontWeight: 800, lineHeight: 1,
                  background: "linear-gradient(135deg, var(--gold-primary), var(--gold-dark))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  marginBottom: "20px",
                }}>{s.step}</div>
                <h4 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "20px", marginBottom: "12px" }}>{s.title}</h4>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: "linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-primary) 50%, var(--gold-dark) 100%)", padding: "80px 0", textAlign: "center" }}>
        <div className="gcs-container">
          <h2 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "clamp(1.8rem, 4vw, 3rem)", marginBottom: "16px" }}>
            Ready to Book Your Stay?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "17px", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
            Loved what you saw? Browse all available properties and make your booking today.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/stays" className="btn btn-white">Browse All Properties</Link>
            <Link href="/contact" className="btn" style={{ borderColor: "rgba(255,255,255,0.5)", border: "2px solid rgba(255,255,255,0.5)", color: "white", background: "transparent" }}>
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* Fullscreen tour modal */}
      {previewProp && (() => {
        const embedUrl = toEmbedUrl(previewProp.virtualTourUrl!)!;
        return (
          <div className="fixed inset-0 z-[999] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
              <div>
                <p className="text-[#c9a961] text-xs font-semibold uppercase tracking-wider">360° Virtual Tour</p>
                <p className="text-white font-semibold">{previewProp.title}</p>
              </div>
              <button
                onClick={() => setPreviewProp(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-xl"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                title={`Virtual Tour — ${previewProp.title}`}
              />
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes kenBurns { 0% { transform: scale(1); } 100% { transform: scale(1.15) translateX(-20px); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
