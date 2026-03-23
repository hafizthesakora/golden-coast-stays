export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Calendar, MapPin, Users, Download, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Booking Confirmed | Golden Coast Stay" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { ref } = await searchParams;

  const booking = ref
    ? await prisma.booking.findFirst({
        where: { reference: { contains: ref } },
        include: {
          property: {
            include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
          },
        },
      })
    : null;

  const image = booking?.property.images[0]?.imageUrl || "/images/h1.jpg";

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-20">
      <div className="max-w-3xl mx-auto px-6 py-14">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="absolute -inset-2 rounded-full border-4 border-green-200 animate-ping opacity-30" />
          </div>
          <h1 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a] mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-[#6c757d] text-lg">
            Your stay is reserved. We&apos;ve sent a confirmation to your email.
          </p>
          {booking && (
            <div className="inline-flex items-center gap-2 bg-[#c9a961]/10 text-[#9a7b3c] px-5 py-2 rounded-full font-semibold text-sm mt-4 border border-[#c9a961]/20">
              Booking Reference: {booking.reference}
            </div>
          )}
        </div>

        {/* Booking Details Card */}
        {booking ? (
          <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden mb-6">
            <div className="relative h-56">
              <Image src={image} alt={booking.property.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">{booking.property.title}</h2>
                <p className="text-white/80 flex items-center gap-1 text-sm mt-1"><MapPin className="h-3.5 w-3.5" />{booking.property.city}, Ghana</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
              <div>
                <div className="text-xs text-[#6c757d] font-medium uppercase tracking-wide mb-1.5">Check-in</div>
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#c9a961]" />
                  <span className="font-semibold text-[#1a1a1a] text-sm">{formatDate(booking.checkIn)}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6c757d] font-medium uppercase tracking-wide mb-1.5">Check-out</div>
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#c9a961]" />
                  <span className="font-semibold text-[#1a1a1a] text-sm">{formatDate(booking.checkOut)}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6c757d] font-medium uppercase tracking-wide mb-1.5">Guests</div>
                <div className="flex flex-col items-center gap-1">
                  <Users className="h-4 w-4 text-[#c9a961]" />
                  <span className="font-semibold text-[#1a1a1a] text-sm">{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6c757d] font-medium uppercase tracking-wide mb-1.5">Total</div>
                <div className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-lg">{formatCurrency(Number(booking.totalAmount))}</div>
              </div>
            </div>
            <div className="px-6 pb-6 border-t border-[#e9ecef] pt-5 grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#6c757d]">Guest Name: </span><span className="font-medium text-[#1a1a1a]">{booking.guestName}</span></div>
              <div><span className="text-[#6c757d]">Email: </span><span className="font-medium text-[#1a1a1a]">{booking.guestEmail}</span></div>
              <div><span className="text-[#6c757d]">Booking Status: </span>
                <span className={`font-semibold capitalize ${booking.status === "confirmed" ? "text-green-600" : "text-[#c9a961]"}`}>{booking.status}</span>
              </div>
              <div><span className="text-[#6c757d]">Payment: </span>
                <span className={`font-semibold capitalize ${booking.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>{booking.paymentStatus}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-8 text-center mb-6">
            <p className="text-[#6c757d]">Booking details are being processed. Check your email for confirmation.</p>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-6 mb-6">
          <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl mb-5">What Happens Next?</h3>
          <div className="space-y-4">
            {[
              { step: "1", title: "Confirmation Email", desc: "A detailed confirmation has been sent to your email address." },
              { step: "2", title: "Team Follow-up", desc: "Our team will contact you within 24 hours with check-in details and access instructions." },
              { step: "3", title: "Check-in Day", desc: "A dedicated concierge will assist with your arrival and settle you into your property." },
              { step: "4", title: "Enjoy Your Stay", desc: "We're available 24/7 throughout your stay for any assistance you need." },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm">{s.title}</p>
                  <p className="text-[#6c757d] text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#1a1a1a] hover:bg-[#343a40] transition-colors">
              View My Bookings <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border-2 border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-white transition-all">
            <Download className="h-4 w-4" /> Download Confirmation
          </button>
          <Link href="/stays" className="flex-1">
            <button className="w-full py-3.5 rounded-xl font-semibold text-sm text-[#343a40] border border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors">
              Browse More Stays
            </button>
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-8 text-sm text-[#6c757d]">
          Need help? <a href="/contact" className="text-[#c9a961] font-medium hover:underline">Contact our support team</a>
        </div>
      </div>
    </div>
  );
}
