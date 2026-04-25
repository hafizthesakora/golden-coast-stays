import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") {
    return null;
  }
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, slug, description, propertyType, city, address, pricePerNight, bedrooms, bathrooms, maxGuests, area, areaUnit, amenities, featured, hasVirtualTour, virtualTourUrl, status, lat, lng, isVerified, verificationLevel, hasPower, hasWater, hasWifi } = body;

    if (!title || !slug || !city || !pricePerNight) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        title, slug, description, propertyType, city, address: address || "",
        pricePerNight, bedrooms: bedrooms || 1, bathrooms: bathrooms || 1,
        maxGuests: maxGuests || 2, area: area ? Number(area) : null, areaUnit: areaUnit || "sqft",
        amenities: amenities || [], featured: featured || false,
        hasVirtualTour: hasVirtualTour || false, virtualTourUrl: virtualTourUrl || null,
        status: status || "available",
        isVerified: isVerified ?? false,
        verificationLevel: verificationLevel || null,
        hasPower: hasPower ?? false,
        hasWater: hasWater ?? false,
        hasWifi: hasWifi ?? false,
        lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null,
      },
    });

    return NextResponse.json({ property });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A property with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
