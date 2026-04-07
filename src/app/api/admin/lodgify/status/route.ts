import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const apiKeyConfigured =
    !!process.env.LODGIFY_API_KEY && process.env.LODGIFY_API_KEY !== "your-lodgify-api-key";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const webhookUrl = siteUrl ? `${siteUrl}/api/webhooks/lodgify` : null;

  const [syncedProperties, lodgifyBookings, totalBookings, lastSyncSetting, lastSyncResultSetting] =
    await Promise.all([
      prisma.property.count({ where: { lodgifyPropertyId: { not: null } } }),
      prisma.booking.count({ where: { lodgifySource: true } }),
      prisma.booking.count(),
      prisma.siteSetting.findUnique({ where: { key: "lodgify_last_sync" } }),
      prisma.siteSetting.findUnique({ where: { key: "lodgify_last_sync_result" } }),
    ]);

  let lastSyncResult: Record<string, unknown> | null = null;
  if (lastSyncResultSetting?.value) {
    try { lastSyncResult = JSON.parse(lastSyncResultSetting.value); } catch { /* ignore */ }
  }

  return NextResponse.json({
    apiKeyConfigured,
    syncedProperties,
    lodgifyBookings,
    totalBookings,
    webhookUrl,
    lastSync: lastSyncSetting?.value ?? null,
    lastSyncResult,
  });
}
