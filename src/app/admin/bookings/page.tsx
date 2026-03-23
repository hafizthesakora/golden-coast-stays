export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import BookingsAdminClient from "./BookingsAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bookings | Admin" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const bookings = await prisma.booking.findMany({
    where:
      status && status !== "all"
        ? { status: status as "pending" | "confirmed" | "completed" | "cancelled" }
        : {},
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          title: true,
          slug: true,
          images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
          owner: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
    // guestName, guestEmail, guestPhone are scalar fields included by default
  });

  return <BookingsAdminClient bookings={serialize(bookings)} currentStatus={status || "all"} />;
}
