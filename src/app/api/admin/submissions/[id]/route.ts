import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session as { user?: { role?: string } })?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, adminNote } = await req.json();

  const submission = await prisma.propertySubmission.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });

  return NextResponse.json({ submission });
}
