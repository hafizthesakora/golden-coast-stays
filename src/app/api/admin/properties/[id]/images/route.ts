import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

// Upload a new image for a property
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    const isPrimary = fd.get("isPrimary") === "true";
    const caption = (fd.get("caption") as string) || null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
    const { url, publicId } = await uploadImage(base64, "properties");

    // If setting as primary, clear existing primaries first
    if (isPrimary) {
      await prisma.propertyImage.updateMany({ where: { propertyId: id }, data: { isPrimary: false } });
    }

    // If this is the first image, make it primary automatically
    const existingCount = await prisma.propertyImage.count({ where: { propertyId: id } });
    const shouldBePrimary = isPrimary || existingCount === 0;

    const image = await prisma.propertyImage.create({
      data: { propertyId: id, imageUrl: url, publicId, isPrimary: shouldBePrimary, caption, order: existingCount },
    });

    return NextResponse.json({ image });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Get all images for a property
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const images = await prisma.propertyImage.findMany({ where: { propertyId: id }, orderBy: [{ isPrimary: "desc" }, { order: "asc" }] });
  return NextResponse.json({ images });
}
