import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const property = await prisma.property.update({
      where: { id },
      data: {
        title: body.title, slug: body.slug, description: body.description,
        propertyType: body.propertyType, city: body.city, address: body.address,
        pricePerNight: body.pricePerNight, bedrooms: body.bedrooms, bathrooms: body.bathrooms,
        maxGuests: body.maxGuests, amenities: body.amenities, featured: body.featured,
        hasVirtualTour: body.hasVirtualTour, virtualTourUrl: body.virtualTourUrl, status: body.status,
        lodgifyPropertyId: body.lodgifyPropertyId || null,
        lodgifyRoomTypeId: body.lodgifyRoomTypeId || null,
      },
    });
    return NextResponse.json({ property });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
