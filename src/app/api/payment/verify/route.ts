import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyBizifyPayment } from "@/lib/bizify";
import { pushBookingToLodgify } from "@/lib/lodgify";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ success: false, error: "Reference required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { reference },
      include: {
        property: { select: { lodgifyPropertyId: true, lodgifyRoomTypeId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user?.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Already paid — just return success
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ success: true, status: "completed" });
    }

    if (!booking.bizifyReference) {
      return NextResponse.json(
        { success: false, error: "No payment initiated for this booking" },
        { status: 400 }
      );
    }

    // Verify with Bizify API
    const transaction = await verifyBizifyPayment(booking.bizifyReference);

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Could not verify payment. Please contact support." },
        { status: 502 }
      );
    }

    if (transaction.status === "completed") {
      // Mark booking as paid and confirmed
      await prisma.booking.update({
        where: { reference },
        data: {
          paymentStatus: "paid",
          status: "confirmed",
          paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
          paymentMethod: transaction.payment_method ?? "bizify",
        },
      });

      // Push to Lodgify to block dates on all other channels
      const { lodgifyPropertyId, lodgifyRoomTypeId } = booking.property;
      if (lodgifyPropertyId && lodgifyRoomTypeId && !booking.lodgifyBookingId) {
        const result = await pushBookingToLodgify({
          propertyId: lodgifyPropertyId,
          roomTypeId: lodgifyRoomTypeId,
          arrival: booking.checkIn.toISOString().slice(0, 10),
          departure: booking.checkOut.toISOString().slice(0, 10),
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone ?? undefined,
          adults: booking.guests,
          totalAmount: Number(booking.totalAmount),
        });
        if (result?.id) {
          await prisma.booking.update({
            where: { reference },
            data: { lodgifyBookingId: String(result.id) },
          });
        }
      }

      return NextResponse.json({ success: true, status: "completed" });
    }

    if (transaction.status === "failed") {
      await prisma.booking.update({
        where: { reference },
        data: { paymentStatus: "failed" },
      });
      return NextResponse.json({ success: false, status: "failed", error: "Payment was declined." });
    }

    // pending or abandoned
    return NextResponse.json({ success: false, status: transaction.status, error: "Payment not completed." });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
