import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Bizify payment verification — marks booking as paid and confirmed.
// When Bizify keys are provided, replace this body with the real SDK verification call.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { reference } = await req.json();
    if (!reference) return NextResponse.json({ success: false, error: "Reference required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { reference } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    // Security: only the booking owner can verify
    if (booking.userId !== session.user?.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ success: true, booking });
    }

    const updated = await prisma.booking.update({
      where: { reference },
      data: { paymentStatus: "paid", status: "confirmed", paidAt: new Date() },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
