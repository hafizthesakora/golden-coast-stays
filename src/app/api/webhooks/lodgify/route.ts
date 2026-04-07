import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLodgifySignature } from "@/lib/lodgify";
import { generateBookingRef } from "@/lib/utils";

// Lodgify → Your platform: inbound webhook.
// Lodgify fires this when a booking is created, changed, or cancelled
// from any channel (Airbnb, Booking.com, direct, manual).
//
// Actual Lodgify reservation payload (from /v1/reservation structure):
// {
//   id, status, arrival, departure, people, total_amount, property_id,
//   rooms: [{room_type_id}],
//   guest: { name, email, phone, phone_numbers: [] }
// }
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  // Verify HMAC signature if secret is configured
  const secret = process.env.LODGIFY_WEBHOOK_SECRET ?? "";
  const signature = req.headers.get("x-lodgify-signature") ?? req.headers.get("x-hub-signature-256");
  if (secret && !verifyLodgifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lodgifyBookingId = String(payload.id ?? payload.booking_id ?? "");
  const lodgifyPropertyId = String(payload.property_id ?? "");
  const status = String(payload.status ?? "");

  if (!lodgifyBookingId || !lodgifyPropertyId) {
    return NextResponse.json({ ok: true, skipped: "missing ids" });
  }

  // Find the matching property in our DB
  const property = await prisma.property.findFirst({
    where: { lodgifyPropertyId },
    select: { id: true, title: true, pricePerNight: true },
  });

  if (!property) {
    console.log(`Lodgify webhook: no local property for Lodgify property ${lodgifyPropertyId}`);
    return NextResponse.json({ ok: true, skipped: "property not mapped" });
  }

  // Handle cancellation
  if (status === "Cancelled" || status === "cancelled") {
    await prisma.booking.updateMany({
      where: { lodgifyBookingId, lodgifySource: true },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ ok: true, action: "cancelled" });
  }

  // Handle date change on existing booking
  const arrival = payload.arrival as string | undefined;
  const departure = payload.departure as string | undefined;

  const existing = await prisma.booking.findFirst({ where: { lodgifyBookingId } });
  if (existing) {
    if (arrival && departure) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(arrival),
          checkOut: new Date(departure),
          status: status === "Cancelled" ? "cancelled" : existing.status,
        },
      });
    }
    return NextResponse.json({ ok: true, action: "updated" });
  }

  // New booking
  if (!arrival || !departure) {
    return NextResponse.json({ error: "Missing arrival/departure" }, { status: 400 });
  }

  const checkIn = new Date(arrival);
  const checkOut = new Date(departure);
  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
  const totalAmount = Number(payload.total_amount ?? 0);
  const pricePerNight = nights > 0 ? totalAmount / nights : Number(property.pricePerNight);
  const guests = Number(payload.people ?? payload.adults ?? 1);

  // Extract guest info from actual Lodgify structure
  const guest = (payload.guest ?? {}) as Record<string, unknown>;
  const guestName = String(guest.name ?? payload.name ?? "Lodgify Guest");
  const guestEmail = String(guest.email ?? payload.email ?? "");
  const guestPhoneArr = guest.phone_numbers as string[] | undefined;
  const guestPhone = String(guest.phone ?? guestPhoneArr?.[0] ?? payload.phone ?? "");

  const reference = generateBookingRef();

  await prisma.booking.create({
    data: {
      reference,
      propertyId: property.id,
      guestName,
      guestEmail,
      guestPhone: guestPhone || null,
      checkIn,
      checkOut,
      guests,
      nights,
      pricePerNight,
      totalAmount,
      status: "confirmed",
      paymentStatus: "paid",
      lodgifyBookingId,
      lodgifySource: true,
    },
  });

  // Notify admins
  try {
    const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: `Lodgify Booking — ${property.title}`,
          body: `${guestName} booked via Lodgify for ${nights} night${nights !== 1 ? "s" : ""}. Check-in: ${arrival}. Ref: ${reference}`,
          type: "info",
          link: "/admin/bookings",
        })),
      });
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, action: "created", reference });
}
