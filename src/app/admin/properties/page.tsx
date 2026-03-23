export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import PropertiesAdminClient from "./PropertiesAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Properties | Admin" };

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string }>;
}) {
  const { ownerId } = await searchParams;

  const [properties, filterOwner] = await Promise.all([
    prisma.property.findMany({
      where: ownerId ? { ownerId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { bookings: true, reviews: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    ownerId
      ? prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, name: true, email: true } })
      : Promise.resolve(null),
  ]);

  return (
    <PropertiesAdminClient
      properties={serialize(properties)}
      filterOwner={filterOwner ?? null}
    />
  );
}
