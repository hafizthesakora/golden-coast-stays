import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session as { user?: { role?: string; id?: string } })?.user?.role;
  const userId = (session as { user?: { id?: string } })?.user?.id;

  if (!session || !userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let services;

  if (role === "admin") {
    // Admins see all services
    services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
      include: { property: { select: { title: true } } },
    });
  } else if (role === "owner") {
    // Owners only see services for their own properties
    services = await prisma.service.findMany({
      where: { property: { ownerId: userId } },
      orderBy: { createdAt: "desc" },
      include: { property: { select: { title: true } } },
    });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ services });
}
