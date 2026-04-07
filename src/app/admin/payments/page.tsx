export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PaymentsAdminClient from "./PaymentsAdminClient";

export const metadata: Metadata = { title: "Payment Configuration | Admin" };

export default async function PaymentsAdminPage() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") {
    redirect("/admin");
  }

  // Fetch or seed all provider configs
  const providers = ["bizify", "paystack", "manual"];
  const configs: Record<string, {
    id: string;
    provider: string;
    apiKey: string | null;
    secretKey: string | null;
    webhookUrl: string | null;
    isLive: boolean;
    isActive: boolean;
    extra: string | null;
    updatedAt: Date;
    createdAt: Date;
  }> = {};

  for (const provider of providers) {
    let config = await prisma.paymentConfig.findFirst({ where: { provider } });
    if (!config) {
      // Seed from env vars on first load
      const envApiKey = provider === "bizify" ? (process.env.NEXT_PUBLIC_BIZIFY_PUBLIC_KEY ?? null) : null;
      const envSecretKey = provider === "bizify" ? (process.env.BIZIFY_SECRET_KEY ?? null) : null;
      const envWebhookUrl = provider === "bizify"
        ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/webhooks/bizify`
        : null;
      const envExtra = provider === "bizify"
        ? JSON.stringify({ merchantId: process.env.BIZIFY_MERCHANT_ID ?? "" })
        : null;

      config = await prisma.paymentConfig.create({
        data: {
          provider,
          apiKey: envApiKey,
          secretKey: envSecretKey,
          webhookUrl: envWebhookUrl || null,
          extra: envExtra,
          isLive: true,
          isActive: provider === "bizify",
        },
      });
    }
    configs[provider] = config;
  }

  // Serialize dates for client
  const serialized = Object.fromEntries(
    Object.entries(configs).map(([k, v]) => [
      k,
      {
        ...v,
        updatedAt: v.updatedAt.toISOString(),
        createdAt: v.createdAt.toISOString(),
      },
    ])
  );

  return <PaymentsAdminClient initialConfigs={serialized} />;
}
