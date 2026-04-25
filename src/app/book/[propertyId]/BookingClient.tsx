"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Bath, Users, Calendar, Shield, Loader2, Plus, Minus, ShoppingBag, ChevronRight, ChevronLeft } from "lucide-react";
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
  nights: number;
  totalAmount: number;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  specialRequests: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
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

const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
  catering: "Catering",
  cleaning: "Cleaning",
  experience: "Experiences",
  general: "General",
};

export default function BookingClient({ property, user, initialCheckIn, initialCheckOut, initialGuests, bookedRanges, existingBooking }: Props) {
  const router = useRouter();
  const price = Number(property.pricePerNight);
  const isResume = !!existingBooking;

  const toDateStr = (val: string) => val ? val.split("T")[0] : "";

  // ── Form state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState<"details" | "addons">("details");
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

  // ── Add-ons state ────────────────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const subtotal = price * nights;
  const serviceFee = Math.round(subtotal * 0.1);
  const addonsTotal = services.reduce((sum, s) => sum + (Number(s.price) * (quantities[s.id] || 0)), 0);
  const total = subtotal + serviceFee + addonsTotal;

  const isBlocked = (ci: string, co: string) => {
    if (!ci || !co) return false;
    const inMs = new Date(ci).getTime();
    const outMs = new Date(co).getTime();
    return bookedRanges.some(
      ({ start, end }) => new Date(start).getTime() < outMs && new Date(end).getTime() >= inMs
    );
  };

  // Fetch services when moving to add-ons step
  useEffect(() => {
    if (step !== "addons" || isResume) return;
    setServicesLoading(true);
    fetch(`/api/services?propertyId=${property.id}`)
      .then(r => r.json())
      .then(data => setServices(data.services ?? []))
      .finally(() => setServicesLoading(false));
  }, [step, property.id, isResume]);

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isResume && existingBooking) {
      router.push(`/book/payment?booking=${existingBooking.id}&ref=${existingBooking.reference}`);
      return;
    }
    if (!checkIn || !checkOut || nights < 1) { setError("Please select valid check-in and check-out dates."); return; }
    if (isBlocked(checkIn, checkOut)) { setError("Selected dates are not available. Please choose different dates."); return; }
    if (!guestName || !guestEmail) { setError("Please fill in your name and email."); return; }
    setStep("addons");
  };

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const selectedServices = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([serviceId, quantity]) => ({ serviceId, quantity }));

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
          totalAmount: subtotal + serviceFee,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          paymentMethod,
          selectedServices,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Booking failed. Please try again."); return; }
      router.push(`/book/payment?booking=${data.bookingId}&ref=${data.reference}`);
    } catch { setError("An error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  };

  // Group services by category
  const byCategory = services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category || "general";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const image = property.images[0]?.imageUrl || "/images/h1.jpg";
  const activeStep = step === "details" ? 1 : 2;

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

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-8">
          {[
            { n: 1, label: "Your Details" },
            { n: 2, label: "Add-ons" },
            { n: 3, label: "Payment" },
            { n: 4, label: "Confirmation" },
          ].map((s, idx) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  s.n < activeStep ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" :
                  s.n === activeStep ? "bg-[#c9a961] border-[#c9a961] text-white" :
                  "bg-white border-[#e9ecef] text-[#6c757d]"
                }`}>{s.n}</div>
                <span className={`text-sm font-medium hidden sm:block ${s.n === activeStep ? "text-[#c9a961]" : s.n < activeStep ? "text-[#1a1a1a]" : "text-[#6c757d]"}`}>{s.label}</span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-3 ${s.n < activeStep ? "bg-[#1a1a1a]" : "bg-[#e9ecef]"}`} />}
            </div>
          ))}
        </div>

        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] mb-4">
          {step === "addons" ? "Pre-Arrival Add-ons" : "Complete Your Booking"}
        </h1>

        {isResume && step === "details" && (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            {/* ── STEP 1: Details ──────────────────────────────────────────── */}
            {step === "details" && (
              <form onSubmit={handleDetailsNext} className="space-y-6">
                {/* Dates & Guests */}
                <div className="bg-white rounded-2xl p-6 border border-[#e9ecef]">
                  <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-5 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#c9a961]" /> Your Stay
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#343a40] mb-1.5">CHECK-IN DATE *</label>
                      <input type="date" value={checkIn} min={new Date().toISOString().split("T")[0]}
                        onChange={e => { if (!isResume) { setCheckIn(e.target.value); setError(""); } }} required
                        readOnly={isResume}
                        className={`w-full h-12 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/20 ${isResume ? "bg-[#f8f9fa] cursor-not-allowed text-[#6c757d]" : isBlocked(checkIn, checkOut) ? "border-red-400" : "border-[#e9ecef] focus:border-[#c9a961]"}`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#343a40] mb-1.5">CHECK-OUT DATE *</label>
                      <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split("T")[0]}
                        onChange={e => { if (!isResume) { setCheckOut(e.target.value); setError(""); } }} required
                        readOnly={isResume}
                        className={`w-full h-12 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/20 ${isResume ? "bg-[#f8f9fa] cursor-not-allowed text-[#6c757d]" : isBlocked(checkIn, checkOut) ? "border-red-400" : "border-[#e9ecef] focus:border-[#c9a961]"}`} />
                    </div>
                    {!isResume && isBlocked(checkIn, checkOut) && checkIn && checkOut && (
                      <p className="col-span-full text-xs text-red-600 font-medium -mt-1">These dates are not available.</p>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-[#343a40] mb-1.5">GUESTS *</label>
                      <select value={guests} onChange={e => { if (!isResume) setGuests(parseInt(e.target.value)); }}
                        disabled={isResume}
                        className={`w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 bg-white ${isResume ? "cursor-not-allowed bg-[#f8f9fa] text-[#6c757d]" : ""}`}>
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

                <Button type="submit" variant="gold" size="xl" className="w-full gap-2">
                  {isResume
                    ? `Proceed to Payment — ${formatCurrency(Number(existingBooking!.totalAmount))}`
                    : nights > 0
                    ? <><span>Continue to Add-ons</span><ChevronRight className="h-5 w-5" /></>
                    : "Continue to Add-ons"}
                </Button>
                <p className="text-xs text-center text-[#6c757d]">
                  <Shield className="h-3.5 w-3.5 inline mr-1 text-[#c9a961]" />
                  Secured by <span className="font-semibold text-[#1a1a1a]">Bizify</span> — PCI DSS compliant payment processing.
                </p>
              </form>
            )}

            {/* ── STEP 2: Add-ons ──────────────────────────────────────────── */}
            {step === "addons" && (
              <div className="space-y-6">
                <button onClick={() => setStep("details")} className="flex items-center gap-1.5 text-sm text-[#6c757d] hover:text-[#1a1a1a] transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back to details
                </button>

                {servicesLoading ? (
                  <div className="bg-white rounded-2xl p-10 border border-[#e9ecef] flex items-center justify-center gap-3 text-[#6c757d]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#c9a961]" /> Loading available add-ons…
                  </div>
                ) : services.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 border border-[#e9ecef] text-center">
                    <ShoppingBag className="h-10 w-10 text-[#e9ecef] mx-auto mb-3" />
                    <p className="text-[#6c757d] text-sm">No add-ons available for this property.</p>
                    <p className="text-[#adb5bd] text-xs mt-1">You can still proceed to confirm your booking.</p>
                  </div>
                ) : (
                  Object.entries(byCategory).map(([cat, items]) => (
                    <div key={cat} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
                      <div className="px-6 py-4 border-b border-[#f0f0f0] bg-[#fafafa]">
                        <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </h3>
                      </div>
                      <div className="divide-y divide-[#f8f9fa]">
                        {items.map(svc => (
                          <div key={svc.id} className="flex items-center gap-4 px-6 py-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1a1a1a] text-sm">{svc.name}</p>
                              {svc.description && <p className="text-[#6c757d] text-xs mt-0.5 line-clamp-2">{svc.description}</p>}
                              <p className="text-[#c9a961] font-semibold text-sm mt-1">{formatCurrency(Number(svc.price))} / unit</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setQty(svc.id, -1)}
                                className="w-8 h-8 rounded-full border border-[#e9ecef] flex items-center justify-center text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors disabled:opacity-30"
                                disabled={!(quantities[svc.id] > 0)}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center font-semibold text-[#1a1a1a] text-sm">
                                {quantities[svc.id] || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(svc.id, 1)}
                                className="w-8 h-8 rounded-full border border-[#e9ecef] flex items-center justify-center text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}

                <Button variant="gold" size="xl" className="w-full gap-2" onClick={handleConfirm} disabled={loading}>
                  {loading
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating booking…</>
                    : nights > 0
                    ? `Confirm & Pay — ${formatCurrency(total)}`
                    : "Confirm Booking"}
                </Button>
                <p className="text-xs text-center text-[#6c757d]">
                  <Shield className="h-3.5 w-3.5 inline mr-1 text-[#c9a961]" />
                  Secured by <span className="font-semibold text-[#1a1a1a]">Bizify</span> — PCI DSS compliant payment processing.
                </p>
              </div>
            )}
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

                {nights > 0 ? (
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
                    {addonsTotal > 0 && (
                      <div className="flex justify-between text-[#c9a961]">
                        <span>Add-ons</span>
                        <span>{formatCurrency(addonsTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-[#1a1a1a] pt-2.5 border-t border-[#e9ecef] text-base">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 text-center text-[#6c757d] text-sm">
                    Select dates to see pricing
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
