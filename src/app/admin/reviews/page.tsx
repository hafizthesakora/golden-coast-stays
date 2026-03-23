export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import ReviewsAdminClient from "./ReviewsAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews | Admin" };

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { title: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });

  type Review = typeof reviews[number];
  const counts = {
    total: reviews.length,
    approved: reviews.filter((r: Review) => r.isApproved).length,
    pending: reviews.filter((r: Review) => !r.isApproved).length,
    avgRating:
      reviews.length
        ? (reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length).toFixed(1)
        : "—",
  };

  return <ReviewsAdminClient reviews={serialize(reviews)} counts={counts} />;
}
