import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = { title: "Settings | Admin" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") {
    redirect("/admin");
  }

  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return <SettingsClient initialSettings={settings} />;
}
