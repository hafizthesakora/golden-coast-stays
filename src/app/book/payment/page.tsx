"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, AlertCircle, Lock, CreditCard,
  ArrowLeft, Calendar, Users, Home, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface BookingDetails {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  nights: number;
  status: string;
  paymentStatus: string;
  property: {
    title: string;
    city: string;
    pricePerNight: number;
    images: { imageUrl: string }[];
  };
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a961]" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("ref");

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) { setError("No booking reference provided."); setLoading(false); return; }
    fetch(`/api/bookings/reference/${reference}`)
      .then(r => r.json())
      .then(data => {
        if (data.booking) {
          // Already paid — redirect straight to confirmation
          if (data.booking.paymentStatus === "paid") {
            router.replace(`/book/confirmation?ref=${reference}`);
            return;
          }
          setBooking(data.booking);
        } else {
          setError("Booking not found.");
        }
      })
      .catch(() => setError("Failed to load booking."))
      .finally(() => setLoading(false));
  }, [reference, router]);

  const handlePay = useCallback(async () => {
    if (!reference) return;
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();

      if (data.success && data.checkout_url) {
        // Redirect to Bizify's hosted checkout page
        window.location.href = data.checkout_url;
      } else {
        setError(data.error ?? "Could not initialize payment. Please try again.");
        setPaying(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setPaying(false);
    }
  }, [reference]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#c9a961] mx-auto mb-4" />
        <p className="text-[#6c757d]">Loading booking details…</p>
      </div>
    </div>
  );

  if (error && !booking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-3">Something went wrong</h2>
        <p className="text-[#6c757d] mb-6">{error}</p>
        <Link href="/dashboard"><Button variant="gold">Back to Dashboard</Button></Link>
      </div>
    </div>
  );

  const nights = booking
    ? Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
    : 0;
  const baseAmount = booking ? Number(booking.property.pricePerNight) * nights : 0;
  const serviceFee = booking ? Number(booking.totalAmount) - baseAmount : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-6 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#6c757d] hover:text-[#1a1a1a] text-sm mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left — Payment */}
          <div className="lg:col-span-3 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#c9a961] flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase">Bizify · Secure Checkout</p>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Complete Your Booking</h1>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <Lock className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">256-bit SSL Secured</p>
                <p className="text-xs text-green-600">Your payment is processed securely by Bizify. We never see your card details.</p>
              </div>
            </div>

            {/* Amount breakdown */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
              <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4">Amount to Pay</h3>
              <div className="text-center py-5 border-b border-[#f0f0f0] mb-4">
                <p className="text-[#6c757d] text-sm mb-1">Total Amount</p>
                <p className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">
                  {booking && formatCurrency(Number(booking.totalAmount))}
                </p>
                <p className="text-[#6c757d] text-sm mt-1">
                  Ref: <span className="font-mono text-[#c9a961]">{booking?.reference}</span>
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#6c757d]">
                  <span>{booking && formatCurrency(Number(booking.property.pricePerNight))}/night × {nights} nights</span>
                  <span>{formatCurrency(baseAmount)}</span>
                </div>
                <div className="flex justify-between text-[#6c757d]">
                  <span>Service fee (10%)</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#1a1a1a] pt-2 border-t border-[#f0f0f0]">
                  <span>Total</span>
                  <span className="text-[#c9a961]">{booking && formatCurrency(Number(booking.totalAmount))}</span>
                </div>
              </div>
            </div>

            {/* What Bizify accepts */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
              <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#c9a961]" /> Accepted Payment Methods
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Visa / Mastercard / Verve", sub: "Credit & Debit Cards" },
                  { label: "MTN Mobile Money", sub: "MoMo Prompt" },
                  { label: "Telecel Cash", sub: "Vodafone Cash" },
                  { label: "AirtelTigo Money", sub: "Mobile Wallet" },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-[#c9a961]/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-[#c9a961]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1a1a1a] leading-tight">{m.label}</p>
                      <p className="text-xs text-[#6c757d]">{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What happens */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-[#c9a961] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#6c757d] leading-relaxed">
                Clicking Pay will take you to Bizify&apos;s secure checkout page where you can choose your preferred payment method.
                After payment, you will be redirected back here with your confirmed booking.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              variant="gold"
              size="lg"
              className="w-full gap-2"
              onClick={handlePay}
              disabled={paying}
            >
              {paying
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to Bizify…</>
                : <><Lock className="h-4 w-4" /> Pay {booking && formatCurrency(Number(booking.totalAmount))} via Bizify</>
              }
            </Button>

            <p className="text-center text-xs text-[#6c757d]">
              Powered by <span className="font-bold text-[#1a1a1a]">Bizify</span> · By completing this payment you agree to our{" "}
              <Link href="/privacy" className="text-[#c9a961] hover:underline">Terms & Privacy Policy</Link>
            </p>
          </div>

          {/* Right — Booking Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden lg:sticky lg:top-28">
              {booking && (
                <div className="relative h-44">
                  <Image
                    src={booking.property.images[0]?.imageUrl || "/images/h1.jpg"}
                    alt={booking.property.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-['Playfair_Display'] font-semibold text-sm">{booking.property.title}</p>
                    <p className="text-white/70 text-xs">{booking.property.city}, Ghana</p>
                  </div>
                </div>
              )}
              <div className="p-5 space-y-4">
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Booking Summary</h3>
                {booking && (
                  <div className="space-y-3">
                    {[
                      { icon: Calendar, label: "Check-in", value: new Date(booking.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                      { icon: Calendar, label: "Check-out", value: new Date(booking.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                      { icon: Users, label: "Guests", value: `${booking.guests} guest${booking.guests > 1 ? "s" : ""}` },
                      { icon: Home, label: "Duration", value: `${nights} night${nights > 1 ? "s" : ""}` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <Icon className="h-4 w-4 text-[#c9a961] flex-shrink-0" />
                        <div>
                          <p className="text-[#6c757d] text-xs">{label}</p>
                          <p className="font-medium text-[#1a1a1a]">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#6c757d] mb-1">Booking Reference</p>
                  <p className="font-mono text-sm font-bold text-[#c9a961]">{booking?.reference}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
