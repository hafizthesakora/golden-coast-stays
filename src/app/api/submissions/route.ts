import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

function generateRef() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "GCS-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const session = await auth();

    const fullName = fd.get("fullName") as string;
    const email = fd.get("email") as string;
    const phone = fd.get("phone") as string;
    const propertyType = (fd.get("propertyType") as string) || null;
    const location = (fd.get("location") as string) || null;
    const bedrooms = fd.get("bedrooms") ? parseInt(fd.get("bedrooms") as string) : null;
    const description = (fd.get("description") as string) || null;
    const message = (fd.get("message") as string) || null;

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Name, email and phone are required" }, { status: 400 });
    }

    // Upload images
    const imageFiles = fd.getAll("images") as File[];
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (file.size === 0) continue;
      const bytes = await file.arrayBuffer();
      const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
      try {
        const { url } = await uploadImage(base64, "submissions");
        imageUrls.push(url);
      } catch {
        // skip failed uploads
      }
    }

    // Unique ref
    let submissionRef = generateRef();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.propertySubmission.findUnique({ where: { submissionRef } });
      if (!exists) break;
      submissionRef = generateRef();
      attempts++;
    }

    const submission = await prisma.propertySubmission.create({
      data: {
        submissionRef,
        userId: session?.user?.id || null,
        fullName,
        email,
        phone,
        propertyType,
        location,
        bedrooms,
        description,
        message,
        images: imageUrls,
        amenities: [],
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, ref: submission.submissionRef });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
