import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLodgifyProperties } from "@/lib/lodgify";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!process.env.LODGIFY_API_KEY) {
    return NextResponse.json({ error: "LODGIFY_API_KEY not configured" }, { status: 500 });
  }

  const properties = await getLodgifyProperties();

  if (properties.length === 0) {
    return NextResponse.json({ synced: 0, created: 0, updated: 0, message: "No properties found on Lodgify" });
  }

  let created = 0;
  let updated = 0;

  for (const lp of properties) {
    const lodgifyPropertyId = String(lp.id);
    const lodgifyRoomTypeId = lp.rooms?.[0]?.id ? String(lp.rooms[0].id) : undefined;

    // Lodgify prices are in USD — store as-is; admin can adjust
    const price = lp.original_min_price ?? lp.min_price ?? 0;
    const description = lp.description ? stripHtml(lp.description) : "";

    // Build a usable image URL (drop the tiny f=32 thumbnail param)
    const rawImageUrl = lp.image_url ?? "";
    const imageUrl = rawImageUrl
      ? (rawImageUrl.startsWith("//") ? "https:" + rawImageUrl : rawImageUrl).replace(/\?.*$/, "")
      : "";

    const existing = await prisma.property.findFirst({ where: { lodgifyPropertyId } });

    if (existing) {
      await prisma.property.update({
        where: { id: existing.id },
        data: {
          title: lp.name ?? existing.title,
          description: description || existing.description,
          city: lp.city ?? existing.city,
          bedrooms: lp.bedrooms ?? existing.bedrooms,
          maxGuests: lp.max_guests ?? existing.maxGuests,
          lat: lp.latitude ? lp.latitude : existing.lat,
          lng: lp.longitude ? lp.longitude : existing.lng,
          ...(lodgifyRoomTypeId ? { lodgifyRoomTypeId } : {}),
        },
      });
      updated++;
    } else {
      const baseSlug = (lp.name ?? `lodgify-${lp.id}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let slug = baseSlug;
      let attempt = 0;
      while (await prisma.property.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      const property = await prisma.property.create({
        data: {
          title: lp.name ?? `Property ${lp.id}`,
          slug,
          description,
          city: lp.city ?? "Accra",
          address: lp.address ?? "",
          pricePerNight: price,
          bedrooms: lp.bedrooms ?? 1,
          bathrooms: lp.bathrooms ?? 1,
          maxGuests: lp.max_guests ?? 2,
          amenities: [],
          status: "inactive", // Admin reviews before publishing
          lat: lp.latitude ?? null,
          lng: lp.longitude ?? null,
          lodgifyPropertyId,
          ...(lodgifyRoomTypeId ? { lodgifyRoomTypeId } : {}),
        },
      });

      // Add primary image if available
      if (imageUrl) {
        await prisma.propertyImage.create({
          data: {
            propertyId: property.id,
            imageUrl,
            isPrimary: true,
            order: 0,
          },
        });
      }

      created++;
    }
  }

  return NextResponse.json({
    synced: properties.length,
    created,
    updated,
    message: `Sync complete: ${created} created, ${updated} updated`,
  });
}
