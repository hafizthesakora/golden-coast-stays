import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import GalleryAdminClient from "./GalleryAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gallery | Admin" };

export default async function AdminGalleryPage() {
  const images = await prisma.galleryImage.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return <GalleryAdminClient images={serialize(images)} />;
}
