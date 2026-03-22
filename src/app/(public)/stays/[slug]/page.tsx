import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import PropertyDetailsClient from "./PropertyDetailsClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await prisma.property.findUnique({ where: { slug } });
  if (!property) return { title: "Property Not Found" };
  return {
    title: `${property.title} | Short-Term Rental in Accra`,
    description: property.description.slice(0, 160),
  };
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!property) notFound();

  // Similar properties
  const similar = await prisma.property.findMany({
    where: {
      propertyType: property.propertyType,
      status: "available",
      id: { not: property.id },
    },
    select: {
      id: true, title: true, slug: true, city: true, propertyType: true,
      pricePerNight: true, bedrooms: true, bathrooms: true, maxGuests: true,
      featured: true, hasVirtualTour: true,
      images: { orderBy: [{ isPrimary: "desc" }], take: 1 },
    },
    orderBy: [{ featured: "desc" }],
    take: 3,
  });

  // Booked date ranges
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: property.id,
      status: { not: "cancelled" },
      checkOut: { gte: new Date() },
    },
    select: { checkIn: true, checkOut: true },
  });

  // Favorite status + existing booking check
  let isFavorite = false;
  let existingBooking: { id: string; status: string; paymentStatus: string; reference: string } | null = null;
  if (session?.user?.id) {
    const [fav, booking] = await Promise.all([
      prisma.favorite.findUnique({
        where: { userId_propertyId: { userId: session.user.id, propertyId: property.id } },
      }),
      prisma.booking.findFirst({
        where: {
          propertyId: property.id,
          userId: session.user.id,
          status: { not: "cancelled" },
        },
        select: { id: true, status: true, paymentStatus: true, reference: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    isFavorite = !!fav;
    existingBooking = booking;
  }

  const avgRating = property.reviews.length
    ? property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length
    : null;

  const flags = await getSettings(["feature_reviews", "feature_booking"]);

  return (
    <PropertyDetailsClient
      property={serialize(property)}
      similar={serialize(similar)}
      bookedRanges={bookings.map((b) => ({
        start: b.checkIn.toISOString().split("T")[0],
        end: b.checkOut.toISOString().split("T")[0],
      }))}
      isFavorite={isFavorite}
      isLoggedIn={!!session}
      avgRating={avgRating}
      showReviews={flags.feature_reviews === "true"}
      showBooking={flags.feature_booking === "true"}
      existingBooking={existingBooking}
    />
  );
}
