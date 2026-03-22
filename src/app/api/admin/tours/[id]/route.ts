import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const tour = await prisma.tour.update({
      where: { id },
      data: { title: body.title, slug: body.slug, description: body.description, date: new Date(body.date), time: body.time, duration: body.duration, meetingPoint: body.meetingPoint, maxParticipants: body.maxParticipants, price: body.price, isActive: body.isActive, ...(body.image !== undefined && { image: body.image }) },
    });
    return NextResponse.json({ tour });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.tour.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
