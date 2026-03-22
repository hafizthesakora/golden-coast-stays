import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user?.id as string;
  const email = session.user?.email ?? "";

  const booking = await prisma.booking.findFirst({
    where: { id, OR: [{ userId }, { guestEmail: email }] },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "cancelled") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  if (booking.status === "completed") return NextResponse.json({ error: "Cannot cancel a completed booking" }, { status: 400 });

  const updateData: Record<string, unknown> = { status: "cancelled" };
  if (booking.paymentStatus === "paid") {
    updateData.paymentStatus = "refunded";
  }

  await prisma.booking.update({ where: { id }, data: updateData });
  return NextResponse.json({ success: true, refunded: booking.paymentStatus === "paid" });
}
