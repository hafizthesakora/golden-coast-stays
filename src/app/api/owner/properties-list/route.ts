import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session as { user?: { role?: string; id?: string } })?.user?.role;
  const userId = (session as { user?: { id?: string } })?.user?.id;

  if (!session || !userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let properties;

  if (role === "admin") {
    properties = await prisma.property.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } else if (role === "owner") {
    properties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ properties });
}
