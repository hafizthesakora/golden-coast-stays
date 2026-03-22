import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  feature_virtual_tours: "true",
  feature_reviews: "false",
  feature_booking: "true",
  booking_min_nights: "1",
  booking_max_advance_days: "365",
  booking_currency: "GHS",
  site_name: "Golden Coast Stays",
  site_tagline: "Premium Short-Term Rentals · Accra, Ghana",
  contact_email: "hello@goldencoaststay.com",
  contact_phone: "+233 50 869 7753",
};

export async function getSetting(key: string): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? "";
  } catch {
    return DEFAULTS[key] ?? "";
  }
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
    const result: Record<string, string> = {};
    for (const k of keys) result[k] = DEFAULTS[k] ?? "";
    for (const row of rows) result[row.key] = row.value;
    return result;
  } catch {
    return Object.fromEntries(keys.map(k => [k, DEFAULTS[k] ?? ""]));
  }
}
