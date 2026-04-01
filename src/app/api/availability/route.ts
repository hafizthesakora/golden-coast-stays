import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLodgifyBlockedDates } from "@/lib/lodgify";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!propertyId || !start || !end) {
    return NextResponse.json({ error: "Missing propertyId, start, or end" }, { status: 400 });
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { lodgifyRoomTypeId: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Use Lodgify if the room type ID is configured
    if (property.lodgifyRoomTypeId) {
      const blocked = await getLodgifyBlockedDates(property.lodgifyRoomTypeId, start, end);
      return NextResponse.json({ blocked, source: "lodgify" });
    }

    // Fallback: derive blocked ranges from local bookings
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { not: "cancelled" },
        checkIn: { lte: new Date(end) },
        checkOut: { gte: new Date(start) },
      },
      select: { checkIn: true, checkOut: true },
    });

    const blocked = bookings.map((b) => ({
      start: b.checkIn.toISOString().split("T")[0],
      end: b.checkOut.toISOString().split("T")[0],
    }));

    return NextResponse.json({ blocked, source: "local" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
