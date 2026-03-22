"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || "Something went wrong. Please try again.");
    } catch { setError("Failed to send. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] p-6 relative overflow-hidden">
      {/* Gold orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a961]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a961]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl px-4 py-2 inline-block shadow-md">
            <Image src="/images/logo.png" alt="Golden Coast Stay" width={160} height={50} className="h-12 w-auto" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-3">Check Your Email</h2>
              <p className="text-[#6c757d] text-sm mb-2">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="text-[#1a1a1a] font-semibold text-sm mb-6">{email}</p>
              <p className="text-[#6c757d] text-xs mb-8">
                Didn&apos;t receive the email? Check your spam folder or try again with a different email address.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-[#c9a961] font-semibold text-sm hover:text-[#9a7b3c] transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-full bg-[#c9a961]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-[#c9a961]" />
                </div>
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-2">Forgot Password?</h2>
                <p className="text-[#6c757d] text-sm">
                  No worries. Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 transition-all"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] hover:from-[#b8974f] hover:to-[#8a6b2c] active:scale-[0.98] transition-all disabled:opacity-60 shadow-md shadow-[#c9a961]/30">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6c757d] hover:text-[#c9a961] transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
