import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { getSetting } from "@/lib/settings";
import VirtualToursClient from "./VirtualToursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "360° Virtual Tours | Golden Coast Stays",
  description: "Experience our properties in immersive 360° virtual tours before you book.",
};

export default async function VirtualToursPage() {
  const enabled = (await getSetting("feature_virtual_tours")) === "true";

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center max-w-md mx-auto px-6 py-20">
          <div className="w-20 h-20 rounded-full bg-[#c9a961]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-[#c9a961]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] mb-3">Virtual Tours</h1>
          <p className="text-[#6c757d] leading-relaxed">
            Our 360° virtual tour experience is coming soon. You&apos;ll be able to explore every room of our properties before you book.
          </p>
        </div>
      </div>
    );
  }

  const properties = await prisma.property.findMany({
    where: {
      hasVirtualTour: true,
      virtualTourUrl: { not: null },
      status: "available",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      city: true,
      propertyType: true,
      pricePerNight: true,
      bedrooms: true,
      bathrooms: true,
      maxGuests: true,
      virtualTourUrl: true,
      images: { orderBy: [{ isPrimary: "desc" }], take: 1 },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  }).catch(() => []);

  return <VirtualToursClient properties={serialize(properties)} />;
}
