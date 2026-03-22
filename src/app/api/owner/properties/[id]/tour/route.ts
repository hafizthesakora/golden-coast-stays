import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as { user?: { id?: string } })?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify property belongs to this owner
  const property = await prisma.property.findFirst({
    where: { id, ownerId: userId },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
  }

  const body = await req.json();
  const { virtualTourUrl } = body;

  const updated = await prisma.property.update({
    where: { id },
    data: {
      virtualTourUrl: virtualTourUrl || null,
      hasVirtualTour: !!virtualTourUrl,
    },
  });

  return NextResponse.json({ success: true, property: { id: updated.id, hasVirtualTour: updated.hasVirtualTour, virtualTourUrl: updated.virtualTourUrl } });
}
