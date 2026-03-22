import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

// Delete an image
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { imageId } = await params;
    const image = await prisma.propertyImage.findUnique({ where: { id: imageId } });
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId).catch(() => {});
    }
    await prisma.propertyImage.delete({ where: { id: imageId } });

    // If this was primary, promote the next image
    if (image.isPrimary) {
      const next = await prisma.propertyImage.findFirst({ where: { propertyId: image.propertyId }, orderBy: { order: "asc" } });
      if (next) await prisma.propertyImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Set as primary image
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id, imageId } = await params;
    await prisma.propertyImage.updateMany({ where: { propertyId: id }, data: { isPrimary: false } });
    await prisma.propertyImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
