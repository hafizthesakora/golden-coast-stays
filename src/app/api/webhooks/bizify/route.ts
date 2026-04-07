import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBizifyWebhook, verifyBizifyPayment } from "@/lib/bizify";
import { pushBookingToLodgify } from "@/lib/lodgify";

// Bizify → Your platform: real-time payment events.
// Register this URL in Bizify dashboard → Integrations → Webhooks:
// https://golden-coast-stays.vercel.app/api/webhooks/bizify
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  // Verify HMAC signature
  const secret = process.env.BIZIFY_WEBHOOK_SECRET ?? "";
  const signature = req.headers.get("x-bizify-signature");
  if (secret && !verifyBizifyWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { event: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = payload;
  const bizifyReference = String(data.reference ?? "");

  if (!bizifyReference) {
    return NextResponse.json({ ok: true, skipped: "no reference" });
  }

  // Find the booking by Bizify reference
  const booking = await prisma.booking.findFirst({
    where: { bizifyReference },
    include: {
      property: { select: { lodgifyPropertyId: true, lodgifyRoomTypeId: true, title: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ ok: true, skipped: "booking not found" });
  }

  if (event === "payment.success") {
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ ok: true, skipped: "already paid" });
    }

    // Double-check with Bizify API before marking paid
    const transaction = await verifyBizifyPayment(bizifyReference);
    if (!transaction || transaction.status !== "completed") {
      return NextResponse.json({ ok: true, skipped: "not completed on verify" });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
        paymentMethod: transaction.payment_method ?? "bizify",
      },
    });

    // Push to Lodgify
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
          where: { id: booking.id },
          data: { lodgifyBookingId: String(result.id) },
        });
      }
    }

    // Notify admins
    try {
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            title: `Payment Received — ${booking.property.title}`,
            body: `${booking.guestName} paid ${data.currency ?? "GHS"} ${data.amount} for booking ${booking.reference}.`,
            type: "success",
            link: "/admin/bookings",
          })),
        });
      }
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true, action: "confirmed" });
  }

  if (event === "payment.failed") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "failed" },
    });
    return NextResponse.json({ ok: true, action: "marked_failed" });
  }

  return NextResponse.json({ ok: true, skipped: "unhandled event" });
}
