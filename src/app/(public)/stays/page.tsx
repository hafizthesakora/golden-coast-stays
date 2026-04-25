export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import StaysClient from "./StaysClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Stays | Browse Premium Short-Term Rentals in Accra",
};

async function getProperties(filters: {
  property_type?: string;
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
  has_power?: string;
  has_water?: string;
  has_wifi?: string;
  verified_only?: string;
}) {
  try {
    const where: Record<string, unknown> = { status: "available" };
    if (filters.property_type) where.propertyType = filters.property_type;
    if (filters.min_price || filters.max_price) {
      where.pricePerNight = {
        ...(filters.min_price ? { gte: parseFloat(filters.min_price) } : {}),
        ...(filters.max_price ? { lte: parseFloat(filters.max_price) } : {}),
      };
    }
    if (filters.bedrooms) where.bedrooms = { gte: parseInt(filters.bedrooms) };
    if (filters.has_power === "true") where.hasPower = true;
    if (filters.has_water === "true") where.hasWater = true;
    if (filters.has_wifi === "true") where.hasWifi = true;
    if (filters.verified_only === "true") where.isVerified = true;

    return await prisma.property.findMany({
      where,
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
        featured: true,
        hasVirtualTour: true,
        isVerified: true,
        verificationLevel: true,
        hasPower: true,
        hasWater: true,
        hasWifi: true,
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 24,
    });
  } catch {
    return [];
  }
}

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const properties = serialize(await getProperties(params));

  return <StaysClient properties={properties} filters={params} />;
}
