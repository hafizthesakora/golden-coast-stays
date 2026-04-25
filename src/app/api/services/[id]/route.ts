import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function authorize(serviceId: string) {
  const session = await auth();
  const role = (session as { user?: { role?: string } })?.user?.role;
  if (!session || (role !== "owner" && role !== "admin")) return null;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { property: { select: { ownerId: true } } },
  });
  if (!service) return null;

  if (role === "owner" && service.property.ownerId !== session.user?.id) return null;
  return service;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await authorize(id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const service = await prisma.service.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      price: body.price,
      category: body.category || "general",
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json({ service });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await authorize(id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
