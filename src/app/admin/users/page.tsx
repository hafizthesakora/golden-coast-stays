import { prisma } from "@/lib/prisma";
import UsersAdminClient from "./UsersAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users | Admin" };

export default async function AdminUsersPage() {
  const users = await prisma.$queryRaw<Array<{
    id: string; name: string | null; email: string; phone: string | null;
    role: string; isSuspended: boolean; lastLoginAt: Date | null; createdAt: Date;
    bookingCount: bigint; favoriteCount: bigint;
  }>>`
    SELECT u.id, u.name, u.email, u.phone, u.role, u."isSuspended", u."lastLoginAt", u."createdAt",
      COUNT(DISTINCT b.id) AS "bookingCount", COUNT(DISTINCT f.id) AS "favoriteCount"
    FROM users u
    LEFT JOIN bookings b ON b."userId" = u.id
    LEFT JOIN favorites f ON f."userId" = u.id
    GROUP BY u.id ORDER BY u."createdAt" DESC
  `;

  const serialized = users.map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    isSuspended: u.isSuspended,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    _count: { bookings: Number(u.bookingCount), favorites: Number(u.favoriteCount) },
  }));

  return <UsersAdminClient users={serialized} />;
}
