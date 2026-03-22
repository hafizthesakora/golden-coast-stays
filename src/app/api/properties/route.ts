import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyType = searchParams.get("propertyType");
    const city = searchParams.get("city");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const featured = searchParams.get("featured");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = Number(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = { status: "available" };
    if (propertyType) where.propertyType = propertyType;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (bedrooms) where.bedrooms = { gte: Number(bedrooms) };
    if (featured === "true") where.featured = true;
    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) (where.pricePerNight as Record<string, number>).gte = Number(minPrice);
      if (maxPrice) (where.pricePerNight as Record<string, number>).lte = Number(maxPrice);
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({ properties, total });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
