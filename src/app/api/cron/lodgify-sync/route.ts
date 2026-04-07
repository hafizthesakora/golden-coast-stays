import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBookingRef } from "@/lib/utils";

// Vercel calls this every 15 minutes via cron.
// It can also be triggered manually from the admin panel with the CRON_SECRET header.
// Security: requests must carry Authorization: Bearer <CRON_SECRET>

interface LodgifyGuest {
  name?: string;
  email?: string;
  phone?: string;
  phone_numbers?: string[];
}

interface LodgifyReservation {
  id: number;
  status: string;
  arrival: string;
  departure: string;
  people: number;
  total_amount: number;
  property_id: number;
  property_name?: string;
  rooms?: { room_type_id: number }[];
  guest: LodgifyGuest;
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.LODGIFY_API_KEY) {
    return NextResponse.json({ error: "LODGIFY_API_KEY not configured" }, { status: 500 });
  }

  const startedAt = Date.now();

  try {
    const res = await fetch("https://api.lodgify.com/v1/reservation", {
      headers: {
        "X-ApiKey": process.env.LODGIFY_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Lodgify API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const reservations: LodgifyReservation[] = Array.isArray(data) ? data : (data.items ?? []);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of reservations) {
      const lodgifyBookingId = String(r.id);

      // Find matching property
      const property = await prisma.property.findFirst({
        where: { lodgifyPropertyId: String(r.property_id) },
        select: { id: true, pricePerNight: true },
      });

      if (!property) { skipped++; continue; }

      const lodgifyStatus = r.status === "Cancelled" ? "cancelled" : "confirmed";

      // Check if booking already exists
      const existing = await prisma.booking.findFirst({ where: { lodgifyBookingId } });

      if (existing) {
        // Sync status and date changes
        const checkIn = new Date(r.arrival);
        const checkOut = new Date(r.departure);
        const changed =
          existing.status !== lodgifyStatus ||
          existing.checkIn.getTime() !== checkIn.getTime() ||
          existing.checkOut.getTime() !== checkOut.getTime();

        if (changed) {
          await prisma.booking.update({
            where: { id: existing.id },
            data: { status: lodgifyStatus, checkIn, checkOut },
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      // New booking — import it
      const checkIn = new Date(r.arrival);
      const checkOut = new Date(r.departure);
      const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
      const totalAmount = r.total_amount ?? 0;
      const pricePerNight = nights > 0 ? totalAmount / nights : Number(property.pricePerNight);
      const guestPhone = r.guest?.phone ?? r.guest?.phone_numbers?.[0] ?? null;

      await prisma.booking.create({
        data: {
          reference: generateBookingRef(),
          propertyId: property.id,
          guestName: r.guest?.name ?? "Lodgify Guest",
          guestEmail: r.guest?.email ?? "",
          guestPhone,
          checkIn,
          checkOut,
          guests: r.people ?? 1,
          nights,
          pricePerNight,
          totalAmount,
          status: lodgifyStatus,
          paymentStatus: lodgifyStatus === "confirmed" ? "paid" : "pending",
          lodgifyBookingId,
          lodgifySource: true,
        },
      });

      // Notify admins about new booking
      try {
        const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              title: `New Lodgify Booking — ${r.property_name ?? "Property"}`,
              body: `${r.guest?.name ?? "Guest"} booked for ${nights} night${nights !== 1 ? "s" : ""}. Check-in: ${r.arrival}.`,
              type: "info",
              link: "/admin/bookings",
            })),
          });
        }
      } catch { /* non-critical */ }

      imported++;
    }

    const elapsed = Date.now() - startedAt;

    // Record last sync time in site settings
    await prisma.siteSetting.upsert({
      where: { key: "lodgify_last_sync" },
      update: { value: new Date().toISOString() },
      create: { key: "lodgify_last_sync", value: new Date().toISOString() },
    });

    await prisma.siteSetting.upsert({
      where: { key: "lodgify_last_sync_result" },
      update: { value: JSON.stringify({ imported, updated, skipped, elapsed }) },
      create: { key: "lodgify_last_sync_result", value: JSON.stringify({ imported, updated, skipped, elapsed }) },
    });

    return NextResponse.json({
      ok: true,
      total: reservations.length,
      imported,
      updated,
      skipped,
      elapsed: `${elapsed}ms`,
    });
  } catch (err) {
    console.error("Lodgify cron sync error:", err);
    return NextResponse.json({ error: "Sync failed", detail: String(err) }, { status: 500 });
  }
}
