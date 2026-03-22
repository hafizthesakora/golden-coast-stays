import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await req.json();
    const { title, slug, description, date, time, duration, meetingPoint, maxParticipants, price, isActive, image } = body;
    if (!title || !slug || !date) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const tour = await prisma.tour.create({
      data: { title, slug, description: description || "", date: new Date(date), time: time || "10:00", duration: duration || "3 hours", meetingPoint: meetingPoint || "", maxParticipants: maxParticipants || 20, price: price || 0, isActive: isActive !== false, image: image || null },
    });
    return NextResponse.json({ tour });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
