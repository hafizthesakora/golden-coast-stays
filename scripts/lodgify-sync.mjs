// One-time sync script: pulls all Lodgify properties + bookings into the DB
// Run: node scripts/lodgify-sync.mjs

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const API_KEY = process.env.LODGIFY_API_KEY;
if (!API_KEY || API_KEY === "your-lodgify-api-key") {
  console.error("LODGIFY_API_KEY not set in .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function bookingRef() {
  return "GCS-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

async function syncProperties() {
  console.log("\n--- Syncing Properties ---");
  const res = await fetch("https://api.lodgify.com/v2/properties", {
    headers: { "X-ApiKey": API_KEY, Accept: "application/json" },
  });
  const data = await res.json();
  const properties = Array.isArray(data) ? data : (data.items ?? []);
  console.log(`Found ${properties.length} properties on Lodgify`);

  let created = 0, updated = 0;
  for (const lp of properties) {
    const lodgifyPropertyId = String(lp.id);
    const lodgifyRoomTypeId = lp.rooms?.[0]?.id ? String(lp.rooms[0].id) : undefined;
    const price = lp.original_min_price ?? lp.min_price ?? 0;
    const description = lp.description ? stripHtml(lp.description) : "";
    const rawImg = lp.image_url ?? "";
    const imageUrl = rawImg
      ? (rawImg.startsWith("//") ? "https:" + rawImg : rawImg).replace(/\?.*$/, "")
      : "";

    const existing = await prisma.property.findFirst({ where: { lodgifyPropertyId } });
    if (existing) {
      await prisma.property.update({
        where: { id: existing.id },
        data: {
          title: lp.name ?? existing.title,
          description: description || existing.description,
          city: lp.city ?? existing.city,
          lat: lp.latitude ?? existing.lat,
          lng: lp.longitude ?? existing.lng,
          ...(lodgifyRoomTypeId ? { lodgifyRoomTypeId } : {}),
        },
      });
      console.log(`  [updated] ${lp.name}`);
      updated++;
    } else {
      const baseSlug = lp.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      let slug = baseSlug, attempt = 0;
      while (await prisma.property.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      const property = await prisma.property.create({
        data: {
          title: lp.name,
          slug,
          description,
          city: lp.city ?? "Accra",
          address: lp.address ?? "",
          pricePerNight: price,
          bedrooms: lp.bedrooms ?? 1,
          bathrooms: lp.bathrooms ?? 1,
          maxGuests: lp.max_guests ?? 2,
          amenities: [],
          status: "inactive",
          lat: lp.latitude ?? null,
          lng: lp.longitude ?? null,
          lodgifyPropertyId,
          ...(lodgifyRoomTypeId ? { lodgifyRoomTypeId } : {}),
        },
      });
      if (imageUrl) {
        await prisma.propertyImage.create({
          data: { propertyId: property.id, imageUrl, isPrimary: true, order: 0 },
        });
      }
      console.log(`  [created] ${lp.name}`);
      created++;
    }
  }
  console.log(`Properties done: ${created} created, ${updated} updated`);
}

async function syncBookings() {
  console.log("\n--- Syncing Bookings ---");
  const res = await fetch("https://api.lodgify.com/v1/reservation", {
    headers: { "X-ApiKey": API_KEY, Accept: "application/json" },
  });
  const data = await res.json();
  const reservations = Array.isArray(data) ? data : (data.items ?? []);
  console.log(`Found ${reservations.length} reservations on Lodgify`);

  let imported = 0, skipped = 0;
  for (const r of reservations) {
    const lodgifyBookingId = String(r.id);
    const exists = await prisma.booking.findFirst({ where: { lodgifyBookingId } });
    if (exists) {
      console.log(`  [skip] ${r.guest?.name ?? "?"} (${r.arrival}) — already exists`);
      skipped++;
      continue;
    }

    const property = await prisma.property.findFirst({
      where: { lodgifyPropertyId: String(r.property_id) },
    });
    if (!property) {
      console.log(`  [skip] ${r.property_name} — property not mapped`);
      skipped++;
      continue;
    }

    const checkIn = new Date(r.arrival);
    const checkOut = new Date(r.departure);
    const nights = Math.max(1, Math.round((checkOut - checkIn) / 86400000));
    const totalAmount = r.total_amount ?? 0;
    const pricePerNight = nights > 0 ? totalAmount / nights : Number(property.pricePerNight);
    const guestPhone = r.guest?.phone ?? r.guest?.phone_numbers?.[0] ?? null;
    const status = r.status === "Cancelled" ? "cancelled" : "confirmed";

    await prisma.booking.create({
      data: {
        reference: bookingRef(),
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
        status,
        paymentStatus: status === "confirmed" ? "paid" : "pending",
        lodgifyBookingId,
        lodgifySource: true,
      },
    });
    console.log(`  [imported] ${r.guest?.name ?? "?"} — ${r.arrival} → ${r.departure} (${r.property_name})`);
    imported++;
  }
  console.log(`Bookings done: ${imported} imported, ${skipped} skipped`);
}

(async () => {
  try {
    await syncProperties();
    await syncBookings();
    console.log("\nAll done.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
