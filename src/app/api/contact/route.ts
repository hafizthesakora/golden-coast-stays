import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, subject, message } = await req.json();
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json({ success: false, error: "All required fields must be filled" }, { status: 400 });
    }
    // TODO: Send email via Nodemailer
    console.log("Contact form submission:", { firstName, lastName, email, phone, subject, message });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
