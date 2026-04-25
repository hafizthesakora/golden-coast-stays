import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: log a custom amenity suggestion (upsert count)
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session as { user?: { role?: string } })?.user?.role;
  if (!session || (role !== "owner" && role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const normalized = name.trim().toLowerCase();
  await prisma.suggestedAmenity.upsert({
    where: { name: normalized },
    update: { count: { increment: 1 } },
    create: { name: normalized },
  });

  return NextResponse.json({ ok: true });
}

// GET: admin only — list all suggested amenities sorted by frequency
export async function GET() {
  const session = await auth();
  const role = (session as { user?: { role?: string } })?.user?.role;
  if (!session || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const amenities = await prisma.suggestedAmenity.findMany({
    orderBy: { count: "desc" },
  });
  return NextResponse.json({ amenities });
}
