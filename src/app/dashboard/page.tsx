export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { serialize } from "@/lib/utils";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Dashboard | Golden Coast Stay" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user?.id as string;

  const [dbUser, bookings, favorites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    }),
    prisma.booking.findMany({
      where: { OR: [{ userId }, { guestEmail: session!.user?.email ?? "" }] },
      include: {
        property: {
          include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  type DashBooking = typeof bookings[number];
  const upcoming = bookings.filter((b: DashBooking) => new Date(b.checkIn) >= now && b.status !== "cancelled").length;
  const completed = bookings.filter((b: DashBooking) => b.status === "completed").length;

  return (
    <Suspense>
      <DashboardClient
        user={{ name: dbUser?.name ?? session!.user?.name ?? "Guest", email: dbUser?.email ?? session!.user?.email ?? "", phone: dbUser?.phone ?? "" }}
        bookings={serialize(bookings)}
        favorites={serialize(favorites.map((f: typeof favorites[number]) => f.property))}
        stats={{ total: bookings.length, upcoming, completed, saved: favorites.length }}
      />
    </Suspense>
  );
}
