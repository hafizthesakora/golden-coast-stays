import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

function genRef() {
  return (
    "SUB-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 5).toUpperCase()
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as { user?: { id?: string } })?.user?.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const submissions = await prisma.propertySubmission.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as { user?: { id?: string } })?.user?.id;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // ── FormData path (supports image upload) ──────────────────────────────
    const fd = await req.formData();

    const fullName      = (fd.get("fullName")      as string) ?? "";
    const email         = (fd.get("email")         as string) ?? "";
    const phone         = (fd.get("phone")         as string) ?? "";
    const propertyType  = (fd.get("propertyType")  as string) || null;
    const location      = (fd.get("location")      as string) ?? "";
    const bedrooms      = (fd.get("bedrooms")      as string) || null;
    const bathrooms     = (fd.get("bathrooms")     as string) || null;
    const maxGuests     = (fd.get("maxGuests")     as string) || null;
    const priceEstimate = (fd.get("priceEstimate") as string) || null;
    const description   = (fd.get("description")  as string) || null;
    const message       = (fd.get("message")       as string) || null;

    let amenities: string[] = [];
    const amenitiesRaw = (fd.get("amenities") as string) ?? "[]";
    try { amenities = JSON.parse(amenitiesRaw); } catch { amenities = []; }

    if (!fullName || !email || !phone || !location) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Upload images to Cloudinary
    const imageFiles = fd.getAll("images") as File[];
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (!file || file.size === 0) continue;
      try {
        const bytes = await file.arrayBuffer();
        const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
        const { url } = await uploadImage(base64, "submissions");
        imageUrls.push(url);
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }

    const submission = await prisma.propertySubmission.create({
      data: {
        submissionRef: genRef(),
        userId,
        fullName,
        email,
        phone,
        propertyType,
        location,
        bedrooms:      bedrooms      ? parseInt(bedrooms)        : null,
        bathrooms:     bathrooms     ? parseInt(bathrooms)       : null,
        maxGuests:     maxGuests     ? parseInt(maxGuests)       : null,
        priceEstimate: priceEstimate ? parseFloat(priceEstimate) : null,
        description,
        message,
        amenities,
        images: imageUrls,
      },
    });

    return NextResponse.json({ success: true, submission });
  }

  // ── JSON path (legacy / fallback) ─────────────────────────────────────────
  const body = await req.json();
  const {
    fullName, email, phone, propertyType, location,
    bedrooms, bathrooms, maxGuests, priceEstimate,
    description, message, amenities,
  } = body;

  if (!fullName || !email || !phone || !location) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const submission = await prisma.propertySubmission.create({
    data: {
      submissionRef: genRef(),
      userId,
      fullName,
      email,
      phone,
      propertyType: propertyType || null,
      location,
      bedrooms:      bedrooms      ? parseInt(bedrooms)        : null,
      bathrooms:     bathrooms     ? parseInt(bathrooms)       : null,
      maxGuests:     maxGuests     ? parseInt(maxGuests)       : null,
      priceEstimate: priceEstimate ? parseFloat(priceEstimate) : null,
      description: description || null,
      message: message || null,
      amenities: amenities || [],
      images: [],
    },
  });

  return NextResponse.json({ success: true, submission });
}
