import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ref } = await params;
    const booking = await prisma.booking.findUnique({
      where: { reference: ref },
      include: {
        property: { include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (booking.userId !== session.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ booking, email: session.user?.email });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
