import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBookingRef, formatCurrency, formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

    const body = await req.json();
    const {
      propertyId, checkIn, checkOut, guests, nights,
      pricePerNight, totalAmount, guestName, guestEmail,
      guestPhone, specialRequests,
    } = body;

    if (!propertyId || !checkIn || !checkOut || nights < 1) {
      return NextResponse.json({ success: false, error: "Invalid booking data" }, { status: 400 });
    }

    // Fetch property with owner info
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true, city: true, ownerId: true },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    // Check availability
    const conflicting = await prisma.booking.count({
      where: {
        propertyId,
        status: { not: "cancelled" },
        OR: [
          { checkIn: { lte: new Date(checkOut) }, checkOut: { gte: new Date(checkIn) } },
        ],
      },
    });

    if (conflicting > 0) {
      return NextResponse.json(
        { success: false, error: "Property is not available for selected dates" },
        { status: 409 }
      );
    }

    const reference = generateBookingRef();

    const booking = await prisma.booking.create({
      data: {
        reference,
        propertyId,
        userId: session.user?.id,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        nights,
        pricePerNight,
        totalAmount,
        specialRequests: specialRequests || null,
        status: "pending",
        paymentStatus: "pending",
      },
    });

    // ── Notifications ─────────────────────────────────────────────────────
    const notifTitle = `New Booking — ${property.title}`;
    const notifBody = `${guestName} booked ${property.title} (${property.city}) for ${nights} night${nights !== 1 ? "s" : ""}. Check-in: ${formatDate(checkIn)}. Total: ${formatCurrency(Number(totalAmount))}. Ref: ${reference}`;
    const notifLink = `/admin/bookings`;

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    const ownerIdList: string[] = [];
    if (property.ownerId) ownerIdList.push(property.ownerId);

    type AdminRow = typeof admins[number];
    const notifyUserIds = [
      ...admins.map((a: AdminRow) => a.id),
      ...ownerIdList.filter((id: string) => !admins.some((a: AdminRow) => a.id === id)),
    ];

    if (notifyUserIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          title: notifTitle,
          body: notifBody,
          type: "success",
          link: admins.some((a: AdminRow) => a.id === userId) ? "/admin/bookings" : "/owner/bookings",
        })),
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    return NextResponse.json({ success: true, bookingId: booking.id, reference: booking.reference });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user?.id },
    include: { property: { include: { images: { take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
