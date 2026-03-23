"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, MapPin, BedDouble, Bath, Users, Star, Wifi, Car,
  Waves, Dumbbell, UtensilsCrossed, Tv, Wind, Shield, Check,
  ChevronLeft, ChevronRight, X, Share2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import PropertyCard from "@/components/property/PropertyCard";

// Ghana city centre coordinates [lat, lon, zoom]
const GHANA_CITIES: Record<string, [number, number, number]> = {
  "accra":              [5.6037, -0.1870, 14],
  "east legon":         [5.6367, -0.1610, 15],
  "cantonments":        [5.5890, -0.1736, 15],
  "airport residential":[5.6084, -0.1749, 15],
  "labone":             [5.5760, -0.1720, 15],
  "osu":                [5.5600, -0.1760, 15],
  "adenta":             [5.7050, -0.1670, 14],
  "tema":               [5.6698, -0.0166, 13],
  "kumasi":             [6.6884, -1.6244, 13],
  "takoradi":           [4.8945, -1.7554, 13],
  "labadi":             [5.5720, -0.1630, 15],
  "ridge":              [5.5730, -0.1900, 15],
  "north legon":        [5.6690, -0.1690, 14],
  "spintex":            [5.6310, -0.0920, 14],
};

function PropertyMap({ city, address }: { city: string; address: string | null }) {
  const key = city.toLowerCase().trim();
  const [lat, lon, zoom] = GHANA_CITIES[key] ?? [5.6037, -0.1870, 13];
  const delta = 0.01 * (16 - zoom);
  const bbox = `${lon - delta},${lat - delta * 0.7},${lon + delta},${lat + delta * 0.7}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const mapsLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-[#e9ecef] relative">
      <iframe
        src={src}
        title={`Map of ${address || city}`}
        className="w-full h-72 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-xs font-medium text-[#343a40] px-3 py-1.5 rounded-lg border border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors shadow-sm flex items-center gap-1"
      >
        <MapPin className="h-3 w-3" /> View larger map
      </a>
    </div>
  );
}

function VirtualTourSection({ embedUrl, title }: { embedUrl: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-5 bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-2xl border border-[#c9a961]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9a961]/20 flex items-center justify-center flex-shrink-0">
            <Eye className="h-5 w-5 text-[#c9a961]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">360° Virtual Tour</p>
            <p className="text-white/50 text-xs mt-0.5">Explore every room before you book</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a961] hover:bg-[#b8943f] text-white text-sm font-semibold transition-colors flex-shrink-0"
        >
          <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Preview Tour
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col" onClick={() => setOpen(false)}>
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-[#c9a961] text-xs font-semibold uppercase tracking-wider">360° Virtual Tour</p>
              <p className="text-white font-semibold">{title}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 px-6 pb-6" onClick={e => e.stopPropagation()}>
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-2xl"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
              title={`Virtual Tour — ${title}`}
            />
          </div>
        </div>
      )}
    </>
  );
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  pool: <Waves className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  kitchen: <UtensilsCrossed className="h-4 w-4" />,
  tv: <Tv className="h-4 w-4" />,
  ac: <Wind className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
};

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
}

interface PropertyImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  city: string;
  address: string | null;
  amenities: string[];
  featured: boolean;
  hasVirtualTour: boolean;
  virtualTourUrl: string | null;
  images: PropertyImage[];
  reviews: Review[];
}

interface SimilarProperty {
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
  images: { imageUrl: string; isPrimary: boolean }[];
}

interface ExistingBooking {
  id: string;
  status: string;
  paymentStatus: string;
  reference: string;
}

interface Props {
  property: Property;
  similar: SimilarProperty[];
  bookedRanges: { start: string; end: string }[];
  isFavorite: boolean;
  isLoggedIn: boolean;
  avgRating: number | null;
  showReviews?: boolean;
  showBooking?: boolean;
  existingBooking?: ExistingBooking | null;
}

export default function PropertyDetailsClient({
  property, similar, bookedRanges, isFavorite: initialFav, isLoggedIn, avgRating,
  showReviews = true, showBooking = true, existingBooking = null,
}: Props) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFav);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [nights, setNights] = useState(0);

  const images = property.images.length > 0 ? property.images : [{ id: "0", imageUrl: "/images/h1.jpg", isPrimary: true }];
  const price = Number(property.pricePerNight);
  const serviceFee = Math.round(price * nights * 0.1);
  const total = price * nights + serviceFee;

  const handleDateChange = (ci: string, co: string) => {
    if (ci && co) {
      const n = Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
      setNights(n);
    }
  };

  const handleBook = () => {
    if (!isLoggedIn) { router.push(`/login?callbackUrl=/stays/${property.slug}`); return; }
    if (existingBooking && existingBooking.status !== "cancelled") {
      router.push(`/book/${property.id}?booking_id=${existingBooking.id}`);
      return;
    }
    if (!checkIn || !checkOut) { alert("Please select check-in and check-out dates."); return; }
    router.push(`/book/${property.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  };

  const toggleFavorite = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setFavorited(!favorited);
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, action: "toggle" }),
    });
  };

  const prevLight = () => setLightboxIdx(i => i !== null ? (i === 0 ? images.length - 1 : i - 1) : 0);
  const nextLight = () => setLightboxIdx(i => i !== null ? (i === images.length - 1 ? 0 : i + 1) : 0);

  return (
    <>
      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-[#c9a961]" onClick={() => setLightboxIdx(null)}>
            <X className="h-8 w-8" />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-[#c9a961]" onClick={(e) => { e.stopPropagation(); prevLight(); }}>
            <ChevronLeft className="h-10 w-10" />
          </button>
          <div className="relative w-full max-w-4xl max-h-[80vh] mx-8" onClick={e => e.stopPropagation()}>
            <Image src={images[lightboxIdx].imageUrl} alt={property.title} fill className="object-contain" />
          </div>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[#c9a961]" onClick={(e) => { e.stopPropagation(); nextLight(); }}>
            <ChevronRight className="h-10 w-10" />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}

      <div className="pt-20 lg:pt-28">
        {/* Image Gallery */}
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-2 gap-2 h-64 sm:h-[480px] rounded-2xl overflow-hidden">
            {/* Main image */}
            <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => setLightboxIdx(0)}>
              <Image src={images[0]?.imageUrl || "/images/h1.jpg"} alt={property.title} fill className="object-cover group-hover:brightness-90 transition-all" priority />
              {images.length > 1 && (
                <div className="sm:hidden absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" /><ChevronRight className="h-3 w-3" />
                  Tap to view all {images.length} photos
                </div>
              )}
            </div>
            {/* Side images */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative cursor-pointer group" onClick={() => setLightboxIdx(Math.min(i, images.length - 1))}>
                {images[i] ? (
                  <Image src={images[i].imageUrl} alt={`${property.title} ${i + 1}`} fill className="object-cover group-hover:brightness-90 transition-all" />
                ) : (
                  <div className="w-full h-full bg-[#e9ecef] flex items-center justify-center">
                    <span className="text-[#6c757d] text-sm">No image</span>
                  </div>
                )}
                {i === 4 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">+{images.length - 5} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* LEFT: Details */}
            <div className="lg:col-span-2 space-y-10">
              {/* Title & Actions */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="gold" className="capitalize">{property.propertyType}</Badge>
                      {property.featured && <Badge variant="dark">✦ Featured</Badge>}
                      {property.hasVirtualTour && <Badge variant="info" className="flex items-center gap-1"><Eye className="h-3 w-3" /> 360° Tour</Badge>}
                    </div>
                    <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-3 text-[#6c757d]">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-[#c9a961]" />{property.city}, Ghana</span>
                      {avgRating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-[#c9a961] fill-[#c9a961]" />
                          <strong className="text-[#1a1a1a]">{avgRating.toFixed(1)}</strong>
                          <span>({property.reviews.length} reviews)</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="w-10 h-10 rounded-full border border-[#e9ecef] flex items-center justify-center text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button onClick={toggleFavorite} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${favorited ? "bg-red-500 border-red-500 text-white" : "border-[#e9ecef] text-[#6c757d] hover:border-red-400 hover:text-red-400"}`}>
                      <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-[#e9ecef]">
                  <span className="flex items-center gap-2 text-[#343a40]">
                    <BedDouble className="h-5 w-5 text-[#c9a961]" /> <strong>{property.bedrooms}</strong> bedroom{property.bedrooms !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-2 text-[#343a40]">
                    <Bath className="h-5 w-5 text-[#c9a961]" /> <strong>{Number(property.bathrooms)}</strong> bathroom{Number(property.bathrooms) !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-2 text-[#343a40]">
                    <Users className="h-5 w-5 text-[#c9a961]" /> Up to <strong>{property.maxGuests}</strong> guests
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1a1a1a] mb-4">About This Property</h2>
                <p className="text-[#343a40] leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div>
                  <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1a1a1a] mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fa] border border-[#e9ecef]">
                        <div className="w-8 h-8 rounded-lg bg-[#c9a961]/10 flex items-center justify-center text-[#c9a961]">
                          {AMENITY_ICONS[amenity.toLowerCase()] || <Check className="h-4 w-4" />}
                        </div>
                        <span className="text-sm text-[#343a40] capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Tour */}
              {property.hasVirtualTour && property.virtualTourUrl && (() => {
                const toEmbedUrl = (url: string): string | null => {
                  if (!url) return null;
                  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
                  if (url.includes("matterport.com")) return url;
                  if (url.startsWith("http")) return url;
                  return null;
                };
                const embedUrl = toEmbedUrl(property.virtualTourUrl);
                if (!embedUrl) return null;
                return <VirtualTourSection embedUrl={embedUrl} title={property.title} />;
              })()}

              {/* Location */}
              <div>
                <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1a1a1a] mb-4">Location</h2>
                <div className="flex items-center gap-2 text-[#6c757d] mb-4">
                  <MapPin className="h-4 w-4 text-[#c9a961]" />
                  <span>{property.address || `${property.city}, Greater Accra, Ghana`}</span>
                </div>
                <PropertyMap city={property.city} address={property.address} />
              </div>

              {/* Reviews */}
              {showReviews && property.reviews.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1a1a1a]">Guest Reviews</h2>
                    {avgRating && (
                      <span className="flex items-center gap-1.5 bg-[#c9a961]/10 text-[#9a7b3c] px-3 py-1 rounded-full text-sm font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current" /> {avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-5">
                    {property.reviews.map((review) => (
                      <div key={review.id} className="p-5 rounded-2xl border border-[#e9ecef] bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white font-bold text-sm">
                              {review.user.name?.[0] ?? "G"}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a1a1a] text-sm">{review.user.name ?? "Guest"}</p>
                              <p className="text-xs text-[#6c757d]">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "text-[#c9a961] fill-[#c9a961]" : "text-[#e9ecef]"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[#343a40] text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Booking Widget */}
            <div className="lg:col-span-1">
              {!showBooking ? (
                <div className="sticky top-24 lg:top-32 bg-white rounded-2xl shadow-xl border border-[#e9ecef] p-6 text-center">
                  <div className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-1">
                    {formatCurrency(property.pricePerNight as unknown as number)}
                    <span className="text-base font-normal text-[#6c757d]"> / night</span>
                  </div>
                  <p className="text-[#6c757d] text-sm mt-3 mb-5">Online booking is not available right now. Please contact us to arrange your stay.</p>
                  <a
                    href="https://wa.me/233508697753"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Enquire via WhatsApp
                  </a>
                </div>
              ) : (
              <div className="sticky top-24 lg:top-32 bg-white rounded-2xl shadow-xl border border-[#e9ecef] p-6">
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-[#6c757d] text-sm">/ night</span>
                  </div>
                  {avgRating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3.5 w-3.5 text-[#c9a961] fill-[#c9a961]" />
                      <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-[#6c757d]">· {property.reviews.length} reviews</span>
                    </div>
                  )}
                </div>

                {/* Date pickers */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl border border-[#e9ecef] p-3">
                    <div className="text-xs font-semibold text-[#343a40] mb-1">CHECK-IN</div>
                    <input
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => { setCheckIn(e.target.value); handleDateChange(e.target.value, checkOut); }}
                      className="w-full text-sm text-[#1a1a1a] focus:outline-none bg-transparent"
                    />
                  </div>
                  <div className="rounded-xl border border-[#e9ecef] p-3">
                    <div className="text-xs font-semibold text-[#343a40] mb-1">CHECK-OUT</div>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => { setCheckOut(e.target.value); handleDateChange(checkIn, e.target.value); }}
                      className="w-full text-sm text-[#1a1a1a] focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="rounded-xl border border-[#e9ecef] p-3 mb-4">
                  <div className="text-xs font-semibold text-[#343a40] mb-1">GUESTS</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#343a40]">{guests} guest{guests !== 1 ? "s" : ""}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-7 h-7 rounded-full border border-[#e9ecef] flex items-center justify-center text-[#343a40] hover:border-[#c9a961] transition-colors text-lg leading-none">−</button>
                      <span className="w-5 text-center text-sm font-medium">{guests}</span>
                      <button onClick={() => setGuests(g => Math.min(property.maxGuests, g + 1))} className="w-7 h-7 rounded-full border border-[#e9ecef] flex items-center justify-center text-[#343a40] hover:border-[#c9a961] transition-colors text-lg leading-none">+</button>
                    </div>
                  </div>
                </div>

                {existingBooking && existingBooking.status !== "cancelled" ? (
                  <div className="mb-4 space-y-2">
                    {(existingBooking.status === "confirmed" || existingBooking.status === "completed") ? (
                      <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <p className="text-emerald-700 font-semibold text-sm">
                          ✓ {existingBooking.status === "completed" ? "Stay Completed" : "Booking Confirmed"}
                        </p>
                        <p className="text-emerald-600 text-xs mt-0.5">Ref: {existingBooking.reference}</p>
                      </div>
                    ) : (
                      <Button onClick={handleBook} variant="gold" size="lg" className="w-full">
                        Continue with Booking
                      </Button>
                    )}
                    <p className="text-xs text-center text-[#6c757d]">
                      You have an existing booking · <a href="/dashboard?tab=bookings" className="text-[#c9a961] hover:underline">View in dashboard</a>
                    </p>
                  </div>
                ) : (
                  <Button onClick={handleBook} variant="gold" size="lg" className="w-full mb-4">
                    {isLoggedIn ? "Reserve Now" : "Sign In to Book"}
                  </Button>
                )}

                {/* Price breakdown */}
                {nights > 0 && (
                  <div className="space-y-2 pt-4 border-t border-[#e9ecef] text-sm">
                    <div className="flex justify-between text-[#343a40]">
                      <span>{formatCurrency(price)} × {nights} night{nights !== 1 ? "s" : ""}</span>
                      <span>{formatCurrency(price * nights)}</span>
                    </div>
                    <div className="flex justify-between text-[#343a40]">
                      <span>Service fee (10%)</span>
                      <span>{formatCurrency(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1a1a1a] pt-2 border-t border-[#e9ecef]">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-center text-[#6c757d] mt-4">You won&apos;t be charged yet</p>

                {/* Booked dates info */}
                {bookedRanges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#e9ecef]">
                    <p className="text-xs text-[#6c757d] font-medium mb-2">Unavailable dates:</p>
                    {bookedRanges.slice(0, 3).map((r, i) => (
                      <p key={i} className="text-xs text-[#6c757d]">
                        {formatDate(r.start)} – {formatDate(r.end)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similar.length > 0 && (
          <section className="bg-[#f8f9fa] py-16 mt-6">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] mb-8">Similar Stays</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similar.map((p) => (
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
                    imageUrl={p.images[0]?.imageUrl}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
