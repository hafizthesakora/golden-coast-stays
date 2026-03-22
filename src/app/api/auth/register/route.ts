import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    let name: string, email: string, phone: string, password: string;

    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await req.json();
      ({ name, email, phone, password } = body);
    } else {
      const fd = await req.formData();
      name = fd.get("name") as string;
      email = fd.get("email") as string;
      phone = fd.get("phone") as string;
      password = fd.get("password") as string;
    }

    if (!name || !email || !password) return NextResponse.json({ success: false, error: "Required fields missing" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, phone: phone || null, password: hashed } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}
