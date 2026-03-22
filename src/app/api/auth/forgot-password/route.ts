import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });

    // Always succeed for security (don't reveal whether email exists)
    await prisma.user.findUnique({ where: { email } });
    // TODO: If user exists, generate token and send email

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
