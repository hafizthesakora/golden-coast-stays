import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    const caption = fd.get("caption") as string;
    const category = fd.get("category") as string;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const uploadResult = await uploadImage(base64, "gallery");

    const image = await prisma.galleryImage.create({
      data: { imageUrl: uploadResult.url, publicId: uploadResult.publicId, caption: caption || null, category: category || "Interior", order: 0 },
    });

    return NextResponse.json({ image });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
