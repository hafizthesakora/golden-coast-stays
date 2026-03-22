import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await params;
    const { status } = await req.json();
    const booking = await prisma.booking.update({ where: { id }, data: { status } });
    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
