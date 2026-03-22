import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import ToursAdminClient from "./ToursAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tours & Virtual Tours | Admin" };

export default async function AdminToursPage() {
  const [tours, properties] = await Promise.all([
    prisma.tour.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.property.findMany({
      orderBy: [{ hasVirtualTour: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        city: true,
        propertyType: true,
        hasVirtualTour: true,
        virtualTourUrl: true,
        images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
      },
    }),
  ]);

  return (
    <ToursAdminClient
      tours={serialize(tours)}
      properties={serialize(properties)}
    />
  );
}
