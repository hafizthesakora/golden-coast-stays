"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle, TrendingUp, Shield, Users, Home, Star, ArrowRight, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: <TrendingUp className="h-6 w-6" />, title: "Higher Returns", desc: "Earn 30-50% more than traditional long-term rentals with our dynamic pricing strategy." },
  { icon: <Shield className="h-6 w-6" />, title: "Full Management", desc: "We handle everything — listing, bookings, cleaning, maintenance, and guest relations." },
  { icon: <Users className="h-6 w-6" />, title: "Vetted Guests", desc: "Only verified, qualified guests stay in your property. Your investment is protected." },
  { icon: <Star className="h-6 w-6" />, title: "5-Star Standards", desc: "We manage your property to luxury standards that attract premium guests." },
];

const steps = [
  { num: "01", title: "Submit Your Property", desc: "Fill out our simple form with your property details and we'll review your application." },
  { num: "02", title: "Property Inspection", desc: "Our team conducts a professional inspection and assessment within 48 hours." },
  { num: "03", title: "Onboarding & Setup", desc: "We handle professional photography, listing creation, and property preparation." },
  { num: "04", title: "Start Earning", desc: "Your property goes live and you start receiving bookings — we handle everything else." },
];

export default function OnboardingPage() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", propertyType: "", location: "", bedrooms: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function addImages(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 8 - images.length);
    if (!newFiles.length) return;
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeImage(i: number) {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      images.forEach(f => fd.append("images", f));
      const res = await fetch("/api/submissions", { method: "POST", body: fd });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="relative pt-20 lg:pt-28 min-h-[70vh] flex items-end overflow-hidden">
        <Image src="/images/h1.jpg" alt="List your property" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="relative max-w-7xl mx-auto px-6 pb-16 w-full">
          <div className="max-w-2xl">
            <p className="text-[#c9a961] text-sm font-semibold tracking-widest uppercase mb-3">Partner with Us</p>
            <h1 className="font-['Playfair_Display'] text-5xl md:text-6xl font-bold text-white mb-5 leading-tight">
              Transform Your Property Into Premium Income
            </h1>
            <p className="text-white/80 text-lg mb-8">
              Join Ghana&apos;s premier short-stay network. We manage everything so you earn more, worry less.
            </p>
            <a href="#apply" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white font-semibold px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(201,169,97,0.5)] transition-all text-sm">
              Apply Now <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">Why List with Us</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">The Golden Coast Advantage</h2>
            <div className="gold-divider mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="group p-6 rounded-2xl border border-[#e9ecef] hover:border-[#c9a961]/40 hover:shadow-xl transition-all duration-300 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#c9a961]/10 flex items-center justify-center text-[#c9a961] mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {b.icon}
                </div>
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-2">{b.title}</h3>
                <p className="text-[#6c757d] text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">How It Works</h2>
            <div className="gold-divider mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-[#c9a961] to-[#e9ecef]" />
                )}
                <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] mb-2">{s.title}</h3>
                <p className="text-[#6c757d] text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="section-padding bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">Get Started</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">List Your Property</h2>
            <p className="text-[#6c757d] mt-4">Fill in the form below and our team will reach out within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="text-center py-14 bg-[#f8f9fa] rounded-2xl border border-[#e9ecef]">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-3">Application Received!</h3>
              <p className="text-[#6c757d]">Thank you for your interest. Our team will contact you within 24 hours to discuss next steps.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#f8f9fa] rounded-2xl p-8 border border-[#e9ecef] space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Full Name *</label>
                  <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Smith" className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961]" /></div>
                <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Email Address *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Phone Number *</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+233..." className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961]" /></div>
                <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Property Type *</label>
                  <select required value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))} className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961]">
                    <option value="">Select type</option>
                    {["Apartment", "Villa", "House", "Studio", "Penthouse", "Townhouse"].map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Location *</label>
                  <input required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="East Legon, Accra" className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961]" /></div>
                <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Number of Bedrooms</label>
                  <select value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} className="w-full h-12 px-3 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961]">
                    <option value="">Select</option>
                    {["Studio", "1", "2", "3", "4", "5", "6+"].map(n => <option key={n} value={n}>{n} bedroom{n !== "Studio" && n !== "1" ? "s" : ""}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium text-[#343a40] mb-1.5">Tell Us About Your Property</label>
                <textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your property, current status, expected income, etc." className="w-full px-3 py-2.5 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:border-[#c9a961] resize-none" /></div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Property Photos <span className="text-[#6c757d] font-normal">(up to 8)</span></label>
                <div
                  className="border-2 border-dashed border-[#e9ecef] rounded-xl p-5 text-center hover:border-[#c9a961]/60 transition-colors cursor-pointer bg-white"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}
                >
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} />
                  <Upload className="h-8 w-8 text-[#c9a961] mx-auto mb-2" />
                  <p className="text-sm text-[#6c757d]">Drag & drop or <span className="text-[#c9a961] font-medium">browse</span> to upload</p>
                  <p className="text-xs text-[#adb5bd] mt-1">JPG, PNG, WEBP — max 8 photos</p>
                </div>
                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#e9ecef]">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
              <Button type="submit" variant="gold" size="lg" className="w-full gap-2" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><Home className="h-4 w-4" />Submit Application</>}
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
