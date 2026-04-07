const LODGIFY_V2 = "https://api.lodgify.com/v2";
const LODGIFY_V1 = "https://api.lodgify.com/v1";

function apiKey() {
  return process.env.LODGIFY_API_KEY ?? "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockedRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface LodgifyCalendarEntry {
  date: string;
  available: number; // 0 = blocked, 1+ = available
}

export interface LodgifyProperty {
  id: number;
  name: string;
  internal_name?: string;
  description?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  image_url?: string;
  min_price?: number;
  original_min_price?: number;
  currency_code?: string;
  is_active?: boolean;
  rooms?: { id: number; name: string }[];
}

export interface PushBookingPayload {
  propertyId: string;       // Lodgify numeric property ID
  roomTypeId: string;       // Lodgify numeric room type ID
  arrival: string;          // YYYY-MM-DD
  departure: string;        // YYYY-MM-DD
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  adults: number;
  totalAmount: number;
  currency?: string;
  source?: string;
}

export interface LodgifyBookingResult {
  id: number;
}

// ─── Calendar / availability ──────────────────────────────────────────────────

export async function getLodgifyBlockedDates(
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<BlockedRange[]> {
  const url = new URL(`${LODGIFY_V2}/calendar/rooms`);
  url.searchParams.set("roomTypeId", roomTypeId);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  const res = await fetch(url.toString(), {
    headers: {
      "X-ApiKey": apiKey(),
      "Accept": "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(`Lodgify calendar fetch failed: ${res.status}`);
    return [];
  }

  const data: LodgifyCalendarEntry[] = await res.json();
  const blocked = data.filter((d) => d.available === 0).map((d) => d.date).sort();

  const ranges: BlockedRange[] = [];
  let rangeStart: string | null = null;
  let prev: string | null = null;

  for (const date of blocked) {
    if (!rangeStart) { rangeStart = date; prev = date; continue; }
    const prevMs = new Date(prev!).getTime();
    const currMs = new Date(date).getTime();
    if (currMs - prevMs === 86400000) {
      prev = date;
    } else {
      ranges.push({ start: rangeStart, end: prev! });
      rangeStart = date; prev = date;
    }
  }
  if (rangeStart && prev) ranges.push({ start: rangeStart, end: prev });

  return ranges;
}

export function isDateRangeBlocked(
  checkIn: string,
  checkOut: string,
  blockedRanges: BlockedRange[]
): boolean {
  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();
  return blockedRanges.some(
    ({ start, end }) =>
      new Date(start).getTime() < outMs && new Date(end).getTime() >= inMs
  );
}

// ─── Push booking to Lodgify ──────────────────────────────────────────────────
// Creates a manual/direct booking on Lodgify to block dates across all channels.

export async function pushBookingToLodgify(
  payload: PushBookingPayload
): Promise<LodgifyBookingResult | null> {
  try {
    // Lodgify API: POST /v1/reservation — matches their actual schema
    const body = {
      property_id: Number(payload.propertyId),
      room_type_id: Number(payload.roomTypeId),
      arrival: payload.arrival,
      departure: payload.departure,
      guest: {
        name: payload.guestName,
        email: payload.guestEmail,
        phone: payload.guestPhone ?? "",
      },
      source: payload.source ?? "Direct",
      people: payload.adults,
      total_amount: payload.totalAmount,
      currency_code: payload.currency ?? "USD",
    };

    const res = await fetch(`${LODGIFY_V1}/reservation`, {
      method: "POST",
      headers: {
        "X-ApiKey": apiKey(),
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Lodgify push booking failed ${res.status}: ${text}`);
      return null;
    }

    const data = await res.json();
    return { id: data.id ?? data.booking_id };
  } catch (err) {
    console.error("pushBookingToLodgify error:", err);
    return null;
  }
}

// ─── Fetch all properties from Lodgify ───────────────────────────────────────

export async function getLodgifyProperties(): Promise<LodgifyProperty[]> {
  try {
    const res = await fetch(`${LODGIFY_V2}/properties`, {
      headers: {
        "X-ApiKey": apiKey(),
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Lodgify properties fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    // API may return { items: [...] } or a direct array
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch (err) {
    console.error("getLodgifyProperties error:", err);
    return [];
  }
}

// Note: Lodgify does not expose a webhook registration API.
// Webhooks must be configured manually in the Lodgify dashboard under Settings → Integrations.

// ─── Webhook signature verification ──────────────────────────────────────────

export function verifyLodgifySignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return !secret; // if no secret configured, skip check
  try {
    const crypto = require("crypto") as typeof import("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature.replace(/^sha256=/, ""), "hex")
    );
  } catch {
    return false;
  }
}
