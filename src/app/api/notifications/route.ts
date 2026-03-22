import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user?.id as string;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user?.id as string;
  const { id } = await req.json().catch(() => ({}));

  if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
