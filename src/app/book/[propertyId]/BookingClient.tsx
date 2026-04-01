"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Bath, Users, Calendar, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  slug: string;
  city: string;
  propertyType: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images: { imageUrl: string }[];
}

interface ExistingBooking {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  specialRequests: string | null;
}

interface Props {
  property: Property;
  user: { id: string; name: string; email: string };
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  bookedRanges: { start: string; end: string }[];
  existingBooking?: ExistingBooking | null;
}

export default function BookingClient({ property, user, initialCheckIn, initialCheckOut, initialGuests, bookedRanges, existingBooking }: Props) {
  const router = useRouter();
  const price = Number(property.pricePerNight);
  const isResume = !!existingBooking;

  const toDateStr = (val: string) => val ? val.split("T")[0] : "";

  const [checkIn, setCheckIn] = useState(isResume ? toDateStr(existingBooking!.checkIn) : initialCheckIn);
  const [checkOut, setCheckOut] = useState(isResume ? toDateStr(existingBooking!.checkOut) : initialCheckOut);
  const [guests, setGuests] = useState(isResume ? existingBooking!.guests : initialGuests);
  const [guestName, setGuestName] = useState(isResume ? (existingBooking!.guestName ?? user.name) : user.name);
  const [guestEmail, setGuestEmail] = useState(isResume ? (existingBooking!.guestEmail ?? user.email) : user.email);
  const [guestPhone, setGuestPhone] = useState(isResume ? (existingBooking!.guestPhone ?? "") : "");
  const [specialRequests, setSpecialRequests] = useState(isResume ? (existingBooking!.specialRequests ?? "") : "");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isBlocked = (ci: string, co: string) => {
    if (!ci || !co) return false;
    const inMs = new Date(ci).getTime();
    const outMs = new Date(co).getTime();
    return bookedRanges.some(
      ({ start, end }) => new Date(start).getTime() < outMs && new Date(end).getTime() >= inMs
    );
  };

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const subtotal = price * nights;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Resuming an existing pending booking — go straight to payment
    if (isResume && existingBooking) {
      router.push(`/book/payment?booking=${existingBooking.id}&ref=${existingBooking.reference}`);
      return;
    }

    if (!checkIn || !checkOut || nights < 1) { setError("Please select valid check-in and check-out dates."); return; }
    if (isBlocked(checkIn, checkOut)) { setError("Selected dates are not available. Please choose different dates."); return; }
    if (!guestName || !guestEmail) { setError("Please fill in your name and email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn,
          checkOut,
          guests,
          nights,
          pricePerNight: price,
          totalAmount: total,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Booking failed. Please try again."); return; }
      router.push(`/book/payment?booking=${data.bookingId}&ref=${data.reference}`);
    } catch { setError("An error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  const image = property.images[0]?.imageUrl || "/images/h1.jpg";

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6c757d] mb-8">
          <Link href="/" className="hover:text-[#c9a961] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/stays" className="hover:text-[#c9a961] transition-colors">Stays</Link>
          <span>/</span>
          <Link href={`/stays/${property.slug}`} className="hover:text-[#c9a961] transition-colors">{property.title}</Link>
          <span>/</span>
          <span className="text-[#1a1a1a] font-medium">Book</span>
        </nav>

        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] mb-4">
          {isResume ? "Complete Your Booking" : "Complete Your Booking"}
        </h1>
        {isResume && (
          <div className="mb-8 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Resuming pending booking</p>
              <p className="text-amber-700 text-xs mt-0.5">Ref: <span className="font-mono font-bold">{existingBooking!.reference}</span> — your details are pre-filled. Click Confirm to proceed to payment.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Form */}
            <div className="lg:col-span-2 space-y-6">
              {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

              {/* Dates & Guests */}
              <div className="bg-white rounded-2xl p-6 border border-[#e9ecef]">
                <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-5 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#c9a961]" /> Your Stay
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">CHECK-IN DATE *</label>
                    <input type="date" value={checkIn} min={new Date().toISOString().split("T")[0]}
                      onChange={e => { setCheckIn(e.target.value); setError(""); }} required
                      className={`w-full h-12 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/20 ${isBlocked(checkIn, checkOut) ? "border-red-400" : "border-[#e9ecef] focus:border-[#c9a961]"}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">CHECK-OUT DATE *</label>
                    <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split("T")[0]}
                      onChange={e => { setCheckOut(e.target.value); setError(""); }} required
                      className={`w-full h-12 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/20 ${isBlocked(checkIn, checkOut) ? "border-red-400" : "border-[#e9ecef] focus:border-[#c9a961]"}`} />
                  </div>
                  {isBlocked(checkIn, checkOut) && checkIn && checkOut && (
                    <p className="col-span-full text-xs text-red-600 font-medium -mt-1">
                      These dates are not available. Please choose different dates.
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">GUESTS *</label>
                    <select value={guests} onChange={e => setGuests(parseInt(e.target.value))}
                      className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 bg-white">
                      {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n} guest{n !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-white rounded-2xl p-6 border border-[#e9ecef]">
                <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-5 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#c9a961]" /> Guest Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">FULL NAME *</label>
                    <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} required
                      className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">EMAIL ADDRESS *</label>
                    <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required
                      className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">PHONE NUMBER</label>
                    <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+233..."
                      className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#343a40] mb-1.5">SPECIAL REQUESTS</label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={3}
                      placeholder="Any special requirements? Early check-in, dietary needs, etc."
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 resize-none" />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 border border-[#e9ecef]">
                <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-5 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#c9a961]" /> Payment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard — Powered by Bizify" },
                    { value: "mobile_money", label: "Mobile Money", sub: "MTN MoMo, Telecel, AirtelTigo — via Bizify" },
                    { value: "bank_transfer", label: "Bank Transfer", sub: "Direct bank payment via Bizify" },
                    { value: "pay_later", label: "Pay at Property", sub: "Confirm now, pay on arrival" },
                  ].map(pm => (
                    <label key={pm.value} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === pm.value ? "border-[#c9a961] bg-[#c9a961]/5" : "border-[#e9ecef] hover:border-[#c9a961]/40"}`}>
                      <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value} onChange={() => setPaymentMethod(pm.value)} className="mt-0.5 accent-[#c9a961]" />
                      <div>
                        <p className="font-medium text-[#1a1a1a] text-sm">{pm.label}</p>
                        <p className="text-[#6c757d] text-xs">{pm.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
                  : isResume
                  ? `Proceed to Payment — ${formatCurrency(Number(property.pricePerNight) * Math.max(0, Math.round((new Date(existingBooking!.checkOut).getTime() - new Date(existingBooking!.checkIn).getTime()) / 86400000)) * 1.1)}`
                  : nights > 0 ? `Confirm Booking — ${formatCurrency(total)}` : "Confirm Booking"}
              </Button>

              <p className="text-xs text-center text-[#6c757d]">
                <Shield className="h-3.5 w-3.5 inline mr-1 text-[#c9a961]" />
                Secured by <span className="font-semibold text-[#1a1a1a]">Bizify</span> — PCI DSS compliant payment processing.
              </p>
            </div>

            {/* RIGHT: Property Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden sticky top-24 lg:top-32">
                <div className="relative h-48">
                  <Image src={image} alt={property.title} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <span className="text-xs text-[#c9a961] font-semibold uppercase tracking-wide capitalize">{property.propertyType}</span>
                  <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mt-1 mb-2">{property.title}</h3>
                  <div className="flex items-center gap-1.5 text-[#6c757d] text-sm mb-4">
                    <MapPin className="h-3.5 w-3.5 text-[#c9a961]" />{property.city}, Ghana
                  </div>
                  <div className="flex gap-4 text-xs text-[#6c757d] pb-4 border-b border-[#e9ecef]">
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-[#c9a961]" />{property.bedrooms} beds</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-[#c9a961]" />{Number(property.bathrooms)} baths</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-[#c9a961]" />Up to {property.maxGuests}</span>
                  </div>

                  {nights > 0 && (
                    <div className="pt-4 space-y-2.5 text-sm">
                      <div className="flex justify-between text-[#343a40]">
                        <span>{checkIn && formatDate(checkIn)} → {checkOut && formatDate(checkOut)}</span>
                        <span className="font-medium">{nights} night{nights !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex justify-between text-[#343a40]">
                        <span>{formatCurrency(price)} × {nights}</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[#343a40]">
                        <span>Service fee (10%)</span>
                        <span>{formatCurrency(serviceFee)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#1a1a1a] pt-2.5 border-t border-[#e9ecef] text-base">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}

                  {nights === 0 && (
                    <div className="pt-4 text-center text-[#6c757d] text-sm">
                      Select dates to see pricing
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
