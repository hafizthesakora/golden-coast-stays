"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("ref");

  const [status, setStatus] = useState<"verifying" | "success" | "failed" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No booking reference found.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();

        if (data.success && data.status === "completed") {
          setStatus("success");
          setMessage("Payment confirmed! Redirecting…");
          setTimeout(() => router.push(`/book/confirmation?ref=${reference}`), 1500);
        } else if (data.status === "failed") {
          setStatus("failed");
          setMessage("Your payment was declined. Please try again.");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Payment could not be verified. Please contact support.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please contact support.");
      }
    }

    verify();
  }, [reference, router]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[#e9ecef] shadow-sm p-10 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#c9a961]/10 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="h-8 w-8 animate-spin text-[#c9a961]" />
            </div>
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-2">Verifying Payment</h2>
            <p className="text-[#6c757d]">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-2">Payment Successful!</h2>
            <p className="text-[#6c757d]">{message}</p>
          </>
        )}

        {(status === "failed" || status === "error") && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-2">
              {status === "failed" ? "Payment Failed" : "Something Went Wrong"}
            </h2>
            <p className="text-[#6c757d] mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              {status === "failed" && reference && (
                <Link
                  href={`/book/payment?ref=${reference}`}
                  className="w-full py-3 rounded-xl bg-[#c9a961] text-white font-semibold text-sm hover:bg-[#9a7b3c] transition-colors"
                >
                  Try Again
                </Link>
              )}
              <Link
                href="/contact"
                className="w-full py-3 rounded-xl border border-[#e9ecef] text-[#6c757d] font-semibold text-sm hover:bg-[#f8f9fa] transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a961]" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
