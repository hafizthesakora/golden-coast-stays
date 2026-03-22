"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function FeatureBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#c9a961]/30 border border-[#c9a961]/60 flex-shrink-0">
        <CheckCircle className="w-3 h-3 text-[#e8d5a3]" />
      </div>
      <span className="text-[#e8d5a3] text-sm font-medium tracking-wide">{text}</span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", terms: false });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errs.name = "Full name must be at least 2 characters";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email address";
    if (!form.password || form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.terms) errs.terms = "You must accept the terms and conditions";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      const res = await fetch("/api/auth/register", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Registration failed. Please try again."); return; }
      // Auto-login
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (result?.ok) router.push("/stays");
      else router.push("/login");
    } catch { setError("An unexpected error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: field === "terms" ? e.target.checked : e.target.value }));

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image src="/images/h4.jpg" alt="Luxury property" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-[#1a1a1a]/70" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9a7b3c] via-[#c9a961] to-[#9a7b3c]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12 text-center">
          <div className="mb-8">
            <div className="bg-white rounded-xl px-4 py-2 inline-block shadow-md">
              <Image src="/images/logo.png" alt="Golden Coast Stay" width={180} height={60} className="mx-auto h-12 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a961]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a961]" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Join Our Community
          </h1>
          <p className="text-[#e8d5a3]/80 text-base xl:text-lg leading-relaxed max-w-sm mb-10">
            Create your account to unlock exclusive access to Ghana&apos;s finest short-term rentals.
          </p>
          <div className="flex flex-col gap-3">
            <FeatureBadge text="50+ Premium Properties" />
            <FeatureBadge text="Instant Booking Confirmation" />
            <FeatureBadge text="Exclusive Member Rates" />
            <FeatureBadge text="24/7 Concierge Support" />
          </div>
          <div className="absolute bottom-10 left-12 right-12 text-center">
            <p className="text-[#c9a961]/60 text-xs tracking-widest uppercase">
              Luxury Short-Term Rentals · Accra, Ghana
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f9fa] px-6 py-12 relative">
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #c9a961 1px, transparent 0)`, backgroundSize: "32px 32px" }}
        />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo.png" alt="Golden Coast Stay" width={150} height={50} className="object-contain" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 xl:p-10">
            <div className="mb-7">
              <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Create Account</h2>
              <p className="text-gray-500 text-sm">Join <span className="text-[#c9a961] font-semibold">Golden Coast Stay</span> today</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.name} onChange={f("name")} placeholder="John Smith" autoComplete="name"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white outline-none transition-all ${fieldErrors.name ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"}`} />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.email} onChange={f("email")} placeholder="you@example.com" autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white outline-none transition-all ${fieldErrors.email ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"}`} />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={f("phone")} placeholder="+233..." autoComplete="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 transition-all" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={f("password")} placeholder="Min. 8 characters" autoComplete="new-password"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white outline-none transition-all ${fieldErrors.password ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"}`} />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c9a961] transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showCpw ? "text" : "password"} value={form.confirmPassword} onChange={f("confirmPassword")} placeholder="Repeat your password" autoComplete="new-password"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white outline-none transition-all ${fieldErrors.confirmPassword ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"}`} />
                  <button type="button" onClick={() => setShowCpw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c9a961] transition-colors">
                    {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={form.terms} onChange={f("terms")} className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#c9a961] cursor-pointer" />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link href="/privacy" className="text-[#c9a961] hover:text-[#9a7b3c] font-medium transition-colors">Privacy Policy</Link>{" "}
                    and{" "}
                    <Link href="/terms" className="text-[#c9a961] hover:text-[#9a7b3c] font-medium transition-colors">Terms of Service</Link>
                  </span>
                </label>
                {fieldErrors.terms && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.terms}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] hover:from-[#b8974f] hover:to-[#8a6b2c] active:scale-[0.98] transition-all disabled:opacity-60 shadow-md shadow-[#c9a961]/30">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating Account…</> : "Create Account"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 uppercase tracking-wider">or</span><div className="flex-1 h-px bg-gray-200" /></div>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-[#c9a961] hover:text-[#9a7b3c] font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
