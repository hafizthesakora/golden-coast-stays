import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (image.publicId) await deleteImage(image.publicId).catch(() => {});
    await prisma.galleryImage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
