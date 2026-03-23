import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const configs = await prisma.paymentConfig.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Ensure each provider has an entry
    const providers = ["bizify", "paystack", "manual"];
    const result: Record<string, unknown> = {};

    type PaymentConfig = typeof configs[number];
    for (const provider of providers) {
      const existing = configs.find((c: PaymentConfig) => c.provider === provider);
      if (existing) {
        result[provider] = existing;
      } else {
        // Create a default config for this provider
        const created = await prisma.paymentConfig.create({
          data: {
            provider,
            isLive: false,
            isActive: provider === "bizify",
          },
        });
        result[provider] = created;
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { provider, apiKey, secretKey, webhookUrl, isLive, isActive, extra } = body;

    if (!provider) return NextResponse.json({ error: "provider is required" }, { status: 400 });

    const existing = await prisma.paymentConfig.findFirst({ where: { provider } });

    const data = {
      apiKey: apiKey ?? null,
      secretKey: secretKey ?? null,
      webhookUrl: webhookUrl ?? null,
      isLive: Boolean(isLive),
      isActive: Boolean(isActive),
      extra: extra ? JSON.stringify(extra) : null,
    };

    let config;
    if (existing) {
      config = await prisma.paymentConfig.update({
        where: { id: existing.id },
        data,
      });
    } else {
      config = await prisma.paymentConfig.create({
        data: { provider, ...data },
      });
    }

    return NextResponse.json({ ok: true, config });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
