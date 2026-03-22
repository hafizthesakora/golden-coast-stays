"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle, Loader2, AlertCircle, Lock, CreditCard,
  ArrowLeft, Calendar, Users, Home, X, Smartphone, Building2,
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
  property: {
    title: string;
    city: string;
    pricePerNight: number;
    images: { imageUrl: string }[];
  };
}

type PayTab = "card" | "mobile" | "bank";

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

function BizifyModal({
  amount,
  onSuccess,
  onClose,
}: {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PayTab>("card");
  const [processing, setProcessing] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [momo, setMomo] = useState("");
  const [momoProvider, setMomoProvider] = useState("mtn");
  const [bankRef, setBankRef] = useState("");

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2800);
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a961] flex items-center justify-center">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Bizify</p>
              <p className="text-white/50 text-[10px]">Secure Payment Gateway</p>
            </div>
          </div>
          <button onClick={onClose} disabled={processing} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-b border-[#e9ecef] text-center">
          <p className="text-xs text-[#6c757d] uppercase tracking-wider mb-1">Amount Due</p>
          <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">{formatCurrency(amount)}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e9ecef]">
          {([
            { key: "card", label: "Card", icon: CreditCard },
            { key: "mobile", label: "Mobile Money", icon: Smartphone },
            { key: "bank", label: "Bank", icon: Building2 },
          ] as { key: PayTab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2 ${
                tab === key
                  ? "border-[#c9a961] text-[#c9a961]"
                  : "border-transparent text-[#6c757d] hover:text-[#343a40]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {tab === "card" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#343a40] mb-1.5">CARD NUMBER</label>
                <input
                  value={cardNum}
                  onChange={e => setCardNum(formatCard(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343a40] mb-1.5">EXPIRY</label>
                  <input
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#343a40] mb-1.5">CVV</label>
                  <input
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="•••"
                    type="password"
                    className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#6c757d]">Accepted: Visa, Mastercard, Verve</p>
            </>
          )}

          {tab === "mobile" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#343a40] mb-1.5">PROVIDER</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "mtn", label: "MTN MoMo" },
                    { val: "telecel", label: "Telecel Cash" },
                    { val: "airteltigo", label: "AirtelTigo" },
                  ].map(p => (
                    <button
                      key={p.val}
                      onClick={() => setMomoProvider(p.val)}
                      type="button"
                      className={`py-2 px-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                        momoProvider === p.val
                          ? "border-[#c9a961] bg-[#c9a961]/5 text-[#9a7b3c]"
                          : "border-[#e9ecef] text-[#6c757d]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#343a40] mb-1.5">MOBILE NUMBER</label>
                <input
                  value={momo}
                  onChange={e => setMomo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="0244 000 000"
                  className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 font-mono"
                />
              </div>
              <p className="text-[10px] text-[#6c757d]">You will receive a prompt on your phone to approve the payment.</p>
            </>
          )}

          {tab === "bank" && (
            <>
              <div className="bg-[#f8f9fa] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#6c757d]">Bank</span><span className="font-semibold text-[#1a1a1a]">GCB Bank Ghana</span></div>
                <div className="flex justify-between"><span className="text-[#6c757d]">Account Name</span><span className="font-semibold text-[#1a1a1a]">Golden Coast Stays</span></div>
                <div className="flex justify-between"><span className="text-[#6c757d]">Account No.</span><span className="font-mono font-bold text-[#c9a961]">1234567890</span></div>
                <div className="flex justify-between"><span className="text-[#6c757d]">Amount</span><span className="font-bold text-[#1a1a1a]">{formatCurrency(amount)}</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#343a40] mb-1.5">TRANSFER REFERENCE / PROOF</label>
                <input
                  value={bankRef}
                  onChange={e => setBankRef(e.target.value)}
                  placeholder="Enter bank transfer reference"
                  className="w-full h-11 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"
                />
              </div>
            </>
          )}
        </div>

        {/* Pay button */}
        <div className="px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing payment…</>
            ) : (
              <><Lock className="h-4 w-4" /> Pay {formatCurrency(amount)} via Bizify</>
            )}
          </button>
          <p className="text-center text-[10px] text-[#6c757d] mt-3">
            256-bit SSL encrypted · PCI DSS compliant
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("ref");

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [paid, setPaid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) { setError("No booking reference provided."); setLoading(false); return; }
    fetch(`/api/bookings/reference/${reference}`)
      .then(r => r.json())
      .then(data => {
        if (data.booking) setBooking(data.booking);
        else setError("Booking not found.");
      })
      .catch(() => setError("Failed to load booking."))
      .finally(() => setLoading(false));
  }, [reference]);

  const handleBizifySuccess = useCallback(async () => {
    setShowModal(false);
    setVerifying(true);
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (data.success) {
        setPaid(true);
        setTimeout(() => router.push(`/book/confirmation?ref=${reference}`), 2000);
      } else {
        setError("Payment verification failed. Please contact support.");
      }
    } catch {
      setError("Verification error. Please contact support.");
    } finally {
      setVerifying(false);
    }
  }, [reference, router]);

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

  if (paid || verifying) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          {verifying
            ? <Loader2 className="h-10 w-10 animate-spin text-[#c9a961]" />
            : <CheckCircle className="h-10 w-10 text-green-500" />
          }
        </div>
        <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-3">
          {verifying ? "Verifying Payment…" : "Payment Successful!"}
        </h2>
        <p className="text-[#6c757d]">
          {verifying ? "Please wait while we confirm your payment." : "Redirecting to your confirmation…"}
        </p>
      </div>
    </div>
  );

  const nights = booking
    ? Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const baseAmount = booking ? Number(booking.property.pricePerNight) * nights : 0;
  const serviceFee = booking ? Number(booking.totalAmount) - baseAmount : 0;

  return (
    <>
      {showModal && booking && (
        <BizifyModal
          amount={Number(booking.totalAmount)}
          onSuccess={handleBizifySuccess}
          onClose={() => setShowModal(false)}
        />
      )}

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
                  <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase">Bizify · Secure Payment</p>
                </div>
                <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Complete Your Booking</h1>
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <Lock className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">256-bit SSL Secured</p>
                  <p className="text-xs text-green-600">Your payment information is encrypted and never stored on our servers.</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4">Amount to Pay</h3>
                <div className="text-center py-5 border-b border-[#f0f0f0] mb-4">
                  <p className="text-[#6c757d] text-sm mb-1">Total Amount</p>
                  <p className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">{booking && formatCurrency(Number(booking.totalAmount))}</p>
                  <p className="text-[#6c757d] text-sm mt-1">Ref: <span className="font-mono text-[#c9a961]">{booking?.reference}</span></p>
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

              {/* Payment methods */}
              <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#c9a961]" /> Accepted via Bizify
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
                onClick={() => setShowModal(true)}
              >
                <Lock className="h-4 w-4" />
                Pay {booking && formatCurrency(Number(booking.totalAmount))} via Bizify
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
    </>
  );
}
