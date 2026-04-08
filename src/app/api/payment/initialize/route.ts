import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeBizifyPayment } from "@/lib/bizify";

// Debug: surface Bizify raw response for easier troubleshooting
async function probeBizify() {
  const sk = process.env.BIZIFY_SECRET_KEY;
  const mid = process.env.BIZIFY_MERCHANT_ID;
  if (!sk) return { ok: false, error: "BIZIFY_SECRET_KEY not set" };
  try {
    const res = await fetch("https://mybizify.com/api/v1/payment/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1, email: "test@test.com", currency: "GHS", ...(mid ? { merchant_id: mid } : {}) }),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ success: false, error: "Booking reference required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { reference },
      include: { property: { select: { title: true, city: true } } },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user?.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
    }

    // If we already initialized but guest didn't complete, reuse the same checkout URL
    if (booking.bizifyReference) {
      const checkoutUrl = `https://mybizify.com/checkout/${booking.bizifyReference}`;
      return NextResponse.json({ success: true, checkout_url: checkoutUrl });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://golden-coast-stays.vercel.app";
    const callbackUrl = `${siteUrl}/book/payment/callback?ref=${reference}`;

    const result = await initializeBizifyPayment({
      amount: Number(booking.totalAmount),
      email: booking.guestEmail,
      name: booking.guestName,
      description: `${booking.property.title} · ${booking.nights} night${booking.nights !== 1 ? "s" : ""} · Ref: ${reference}`,
      callback_url: callbackUrl,
      metadata: {
        booking_reference: reference,
        property: booking.property.title,
        check_in: booking.checkIn.toISOString().slice(0, 10),
        check_out: booking.checkOut.toISOString().slice(0, 10),
      },
    });

    if (!result) {
      // Run a probe to surface the real Bizify error in the response (dev/debug only)
      const probe = await probeBizify();
      console.error("Bizify probe:", probe);
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway error. Please try again.",
          _debug: process.env.NODE_ENV !== "production" ? probe : undefined,
        },
        { status: 502 }
      );
    }

    // Store Bizify reference on the booking
    await prisma.booking.update({
      where: { reference },
      data: { bizifyReference: result.reference },
    });

    return NextResponse.json({ success: true, checkout_url: result.checkout_url });
  } catch (err) {
    console.error("Payment initialize error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
