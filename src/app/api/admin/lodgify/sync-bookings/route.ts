import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBookingRef } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

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
  rooms?: { room_type_id: number }[];
  guest: LodgifyGuest;
  currency?: { code: string };
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!process.env.LODGIFY_API_KEY) {
    return NextResponse.json({ error: "LODGIFY_API_KEY not configured" }, { status: 500 });
  }

  // Fetch all reservations from Lodgify
  const res = await fetch("https://api.lodgify.com/v1/reservation", {
    headers: {
      "X-ApiKey": process.env.LODGIFY_API_KEY,
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Lodgify API error: ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const reservations: LodgifyReservation[] = data.items ?? (Array.isArray(data) ? data : []);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of reservations) {
    const lodgifyBookingId = String(r.id);

    // Skip if already in DB
    const existing = await prisma.booking.findFirst({ where: { lodgifyBookingId } });
    if (existing) { skipped++; continue; }

    // Find matching property by Lodgify property ID
    const property = await prisma.property.findFirst({
      where: { lodgifyPropertyId: String(r.property_id) },
      select: { id: true, pricePerNight: true },
    });

    if (!property) { skipped++; continue; } // Property not yet synced

    const checkIn = new Date(r.arrival);
    const checkOut = new Date(r.departure);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
    const totalAmount = r.total_amount ?? 0;
    const pricePerNight = nights > 0 ? totalAmount / nights : Number(property.pricePerNight);

    const guestName = r.guest?.name ?? "Lodgify Guest";
    const guestEmail = r.guest?.email ?? "";
    const guestPhone = r.guest?.phone ?? r.guest?.phone_numbers?.[0] ?? null;
    const guests = r.people ?? 1;

    // Map Lodgify status to our BookingStatus
    const statusMap: Record<string, "pending" | "confirmed" | "cancelled"> = {
      Open: "confirmed",
      Confirmed: "confirmed",
      Cancelled: "cancelled",
      Closed: "confirmed",
    };
    const status = statusMap[r.status] ?? "confirmed";

    try {
      await prisma.booking.create({
        data: {
          reference: generateBookingRef(),
          propertyId: property.id,
          guestName,
          guestEmail,
          guestPhone,
          checkIn,
          checkOut,
          guests,
          nights,
          pricePerNight,
          totalAmount,
          status,
          paymentStatus: status === "confirmed" ? "paid" : "pending",
          lodgifyBookingId,
          lodgifySource: true,
        },
      });
      imported++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    total: reservations.length,
    imported,
    skipped,
    failed,
    message: `${imported} bookings imported, ${skipped} already existed or property not mapped`,
  });
}
