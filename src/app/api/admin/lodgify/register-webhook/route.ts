import { NextResponse } from "next/server";

// Lodgify does not support webhook registration via API.
// Webhooks must be configured manually in the Lodgify dashboard.
// This endpoint returns the URL to copy into the Lodgify dashboard.
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const webhookUrl = siteUrl ? `${siteUrl}/api/webhooks/lodgify` : null;
  return NextResponse.json({
    webhookUrl,
    instructions: "Register this URL manually in Lodgify → Settings → Integrations.",
  });
}
