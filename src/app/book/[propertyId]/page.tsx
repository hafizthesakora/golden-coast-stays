export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookingClient from "./BookingClient";
import { serialize } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Book Now | Golden Coast Stay" };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/book");

  const { propertyId } = await params;
  const sp = await searchParams;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
  });

  if (!property) redirect("/stays");

  // If continuing an existing booking, fetch it (security: must belong to current user)
  const existingBooking = sp.booking_id
    ? await prisma.booking.findUnique({
        where: { id: sp.booking_id },
        select: {
          id: true, reference: true, checkIn: true, checkOut: true,
          guests: true, guestName: true, guestEmail: true, guestPhone: true, specialRequests: true,
        },
      }).then((b: { id: string; reference: string; checkIn: Date; checkOut: Date; guests: number; guestName: string | null; guestEmail: string | null; guestPhone: string | null; specialRequests: string | null } | null) => (b && b.id ? b : null))
    : null;

  // Get booked ranges (exclude the existing booking so it doesn't block itself)
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { not: "cancelled" },
      checkOut: { gte: new Date() },
      ...(existingBooking ? { id: { not: existingBooking.id } } : {}),
    },
    select: { checkIn: true, checkOut: true },
  });

  return (
    <BookingClient
      property={serialize(property)}
      user={{ id: session.user?.id ?? "", name: session.user?.name ?? "", email: session.user?.email ?? "" }}
      initialCheckIn={sp.check_in || ""}
      initialCheckOut={sp.check_out || ""}
      initialGuests={parseInt(sp.guests || "1")}
      bookedRanges={bookings.map((b: { checkIn: Date; checkOut: Date }) => ({
        start: b.checkIn.toISOString().split("T")[0],
        end: b.checkOut.toISOString().split("T")[0],
      }))}
      existingBooking={existingBooking ? serialize(existingBooking) : null}
    />
  );
}
