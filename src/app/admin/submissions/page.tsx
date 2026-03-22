import { prisma } from "@/lib/prisma";
import SubmissionsAdminClient from "./SubmissionsAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Property Submissions | Admin" };

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const [submissions, counts] = await Promise.all([
    prisma.propertySubmission.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    }),
    prisma.propertySubmission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // Fetch linked users separately to avoid Prisma client cache issues
  const userIds = [...new Set(submissions.map(s => s.userId).filter(Boolean))] as string[];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  // This month count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thisMonthCount = await prisma.propertySubmission.count({ where: { createdAt: { gte: startOfMonth } } });

  const enriched = submissions.map(s => ({
    ...s,
    priceEstimate: s.priceEstimate ? s.priceEstimate.toString() : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    user: s.userId ? (userMap[s.userId] ?? null) : null,
  }));

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count._all]));
  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <SubmissionsAdminClient
      submissions={enriched as Parameters<typeof SubmissionsAdminClient>[0]["submissions"]}
      countMap={countMap}
      currentStatus={status}
      totalCount={totalCount}
      thisMonthCount={thisMonthCount}
    />
  );
}
