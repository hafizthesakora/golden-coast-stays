"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, BedDouble, Bath, Users, Star, Eye, ShieldCheck, Zap, Droplets, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";

interface PropertyCardProps {
  id: string;
  title: string;
  slug: string;
  city: string;
  propertyType: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  featured?: boolean;
  hasVirtualTour?: boolean;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  hasPower?: boolean;
  hasWater?: boolean;
  hasWifi?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function PropertyCard({
  id,
  title,
  slug,
  city,
  propertyType,
  pricePerNight,
  bedrooms,
  bathrooms,
  maxGuests,
  featured = false,
  hasVirtualTour = false,
  isVerified = false,
  hasPower = false,
  hasWater = false,
  hasWifi = false,
  imageUrl,
  rating,
  reviewCount = 0,
  isFavorite = false,
  onToggleFavorite,
}: PropertyCardProps) {
  const [favorited, setFavorited] = useState(isFavorite);
  const [imgError, setImgError] = useState(false);
  const { format: formatMoney } = useCurrency();

  const fallbackImage = "/images/h1.jpg";
  const displayImage = imgError || !imageUrl ? fallbackImage : imageUrl;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorited(!favorited);
    onToggleFavorite?.(id);
  };

  return (
    <Link href={`/stays/${slug}`} className="group block">
      <article className="luxury-card h-full flex flex-col">
        {/* Image */}
        <div className="relative h-60 overflow-hidden">
          <Image
            src={displayImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {featured && (
              <Badge variant="gold" className="shadow-md text-xs">
                ✦ Featured
              </Badge>
            )}
            <Badge variant="dark" className="capitalize text-xs">
              {propertyType}
            </Badge>
            {hasVirtualTour && (
              <Badge variant="info" className="shadow-md text-xs flex items-center gap-1">
                <Eye className="h-3 w-3" /> 360°
              </Badge>
            )}
            {isVerified && (
              <Badge variant="success" className="shadow-md text-xs flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            className={cn(
              "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
              favorited
                ? "bg-red-500 text-white scale-110"
                : "bg-white/90 text-[#6c757d] hover:bg-white hover:text-red-500"
            )}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn("h-4 w-4 transition-all", favorited && "fill-current")}
            />
          </button>

          {/* Rating */}
          {rating && reviewCount > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow">
              <Star className="h-3 w-3 text-[#c9a961] fill-[#c9a961]" />
              <span className="text-xs font-semibold text-[#1a1a1a]">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-[#6c757d]">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg leading-tight group-hover:text-[#c9a961] transition-colors line-clamp-2">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-[#6c757d] text-sm mb-4">
            <MapPin className="h-3.5 w-3.5 text-[#c9a961] flex-shrink-0" />
            <span className="truncate">{city}, Ghana</span>
          </div>

          {/* Amenities row */}
          <div className="flex items-center gap-4 text-xs text-[#6c757d] mb-3 pb-3 border-b border-[#f0f0f0]">
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-3.5 w-3.5 text-[#c9a961]" />
              {bedrooms} bed{bedrooms !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5 text-[#c9a961]" />
              {bathrooms} bath
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#c9a961]" />
              Up to {maxGuests}
            </span>
          </div>

          {/* Infrastructure tags */}
          {(hasPower || hasWater || hasWifi) && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {hasPower && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Zap className="h-2.5 w-2.5" /> Power
                </span>
              )}
              {hasWater && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  <Droplets className="h-2.5 w-2.5" /> Water
                </span>
              )}
              {hasWifi && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <Wifi className="h-2.5 w-2.5" /> WiFi
                </span>
              )}
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a]">
                  {formatMoney(pricePerNight)}
                </span>
              </div>
              <span className="text-xs text-[#6c757d]">per night</span>
            </div>
            <Button
              variant="gold"
              size="sm"
              className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
            >
              Book Now
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
}
