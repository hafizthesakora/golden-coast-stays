import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

  const { propertyId, action } = await req.json();
  const userId = session.user?.id as string;

  if (!propertyId) return NextResponse.json({ success: false, error: "Property ID required" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  });

  if (action === "remove" || (action === "toggle" && existing)) {
    if (existing) await prisma.favorite.delete({ where: { userId_propertyId: { userId, propertyId } } });
    return NextResponse.json({ success: true, isFavorite: false });
  }

  if (!existing) {
    await prisma.favorite.create({ data: { userId, propertyId } });
  }

  return NextResponse.json({ success: true, isFavorite: true });
}
