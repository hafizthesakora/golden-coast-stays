import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Public: GET /api/services?propertyId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ services: [] });

  const services = await prisma.service.findMany({
    where: { propertyId, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ services });
}

// Owner/Admin: POST /api/services
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session as { user?: { role?: string } })?.user?.role;
  if (!session || (role !== "owner" && role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { propertyId, name, description, price, category } = body;

  if (!propertyId || !name || price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Owners can only add services to their own properties
  if (role === "owner") {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    if (property?.ownerId !== session.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const service = await prisma.service.create({
    data: { propertyId, name, description: description || null, price, category: category || "general" },
  });
  return NextResponse.json({ service });
}
