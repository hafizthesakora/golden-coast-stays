"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import AnimateIn from "@/components/ui/AnimateIn";

const SUBJECTS = [
  "Booking Inquiry", "Property Information", "Tour & Experience",
  "Partnership / List Your Property", "Technical Support", "General Inquiry",
];

export default function ContactPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setSubmitted(true); }
      else { setError("Something went wrong. Please try again."); }
    } catch { setError("Failed to send. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: "url('/images/h4.jpg')" }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content gcs-container">
          <p className="section-subtitle" style={{ marginBottom: "12px" }}>{t("contact_hero_sub")}</p>
          <h1>{t("contact_hero_h1")}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "17px", marginBottom: "20px", maxWidth: "520px" }}>
            {t("contact_hero_desc")}
          </p>
          <nav className="breadcrumb">
            <a href="/">Home</a><span>/</span><span style={{ color: "rgba(255,255,255,0.8)" }}>Contact</span>
          </nav>
        </div>
      </div>

      {/* Contact Info Cards */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <AnimateIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: <Mail className="h-7 w-7" />,
              title: t("contact_email_title"),
              lines: ["support@goldencoaststays.com"],
              sub: t("contact_email_sub"),
            },
            {
              icon: <MapPin className="h-7 w-7" />,
              title: t("contact_office_title"),
              lines: ["6, Tetramante Drive, North Legon", "Accra, Ghana"],
              sub: t("contact_hours_val"),
            },
            {
              icon: <Phone className="h-7 w-7" />,
              title: t("contact_phone_title"),
              lines: ["+233 50 869 7753"],
              sub: t("contact_hours_val"),
            },
          ].map((card) => (
            <div key={card.title} className="group p-7 rounded-2xl bg-white border border-[#e9ecef] hover:border-[#c9a961]/40 hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a961]/20 to-[#9a7b3c]/10 flex items-center justify-center text-[#c9a961] mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl mb-3">{card.title}</h3>
              {card.lines.map((l) => <p key={l} className="text-[#343a40] text-sm">{l}</p>)}
              <p className="text-[#6c757d] text-xs mt-3 flex items-center justify-center gap-1.5"><Clock className="h-3 w-3" />{card.sub}</p>
            </div>
          ))}
        </div>
        </AnimateIn>

        {/* Contact Form */}
        <AnimateIn delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-2">Send a Message</p>
            <h2 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] mb-8">How Can We Help?</h2>

            {submitted ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-3">{t("contact_success_h3")}</h3>
                <p className="text-[#6c757d]">{t("contact_success_p")}</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-[#c9a961] text-sm font-medium hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#343a40] mb-1.5">{t("contact_firstname")} *</label>
                    <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" className="w-full h-12 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343a40] mb-1.5">{t("contact_lastname")} *</label>
                    <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Smith" className="w-full h-12 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961] transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#343a40] mb-1.5">{t("contact_email")} *</label>
                    <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full h-12 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#343a40] mb-1.5">{t("contact_phone")}</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+233..." className="w-full h-12 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">{t("contact_subject")} *</label>
                  <select required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full h-12 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961] bg-white transition-all">
                    <option value="">Select a subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">{t("contact_message")} *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us how we can help..." className="w-full px-4 py-3 rounded-xl border border-[#e9ecef] text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961] resize-y transition-all" />
                </div>
                <Button type="submit" variant="gold" size="lg" disabled={loading} className="w-full gap-2">
                  {loading ? t("contact_sending") : <><Send className="h-4 w-4" /> {t("contact_send")}</>}
                </Button>
              </form>
            )}
          </div>

          {/* Side info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#f8f9fa] rounded-2xl p-7 border border-[#e9ecef]">
              <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl mb-5">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {[["50+", "Properties"], ["500+", "Happy Guests"], ["24-72h", "Response Time"], ["100%", "Satisfaction"]].map(([v, l]) => (
                  <div key={l} className="text-center p-4 bg-white rounded-xl border border-[#e9ecef]">
                    <div className="font-['Playfair_Display'] text-2xl font-bold text-[#c9a961]">{v}</div>
                    <div className="text-[#6c757d] text-xs mt-1">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-2xl p-7">
              <h3 className="font-['Playfair_Display'] font-semibold text-white text-xl mb-3">Find Us</h3>
              <p className="text-[#9ca3af] text-sm mb-4">We are located in North Legon, Accra — easily accessible from Airport Residential and Cantonment.</p>
              {/* North Legon / East Legon, Accra — OSM embed */}
              <div className="rounded-xl overflow-hidden relative">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-0.1850,5.6100,-0.1400,5.6600&layer=mapnik&marker=5.6367,-0.1610"
                  title="Golden Coast Stay Office — North Legon, Accra"
                  className="w-full h-44 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href="https://www.openstreetmap.org/?mlat=5.6367&mlon=-0.1610#map=15/5.6367/-0.1610"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-white/90 text-xs text-[#343a40] px-2.5 py-1 rounded-lg hover:text-[#c9a961] transition-colors flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> Larger map
                </a>
              </div>
            </div>
          </div>
        </div>
        </AnimateIn>
      </section>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-[#9a7b3c] via-[#c9a961] to-[#9a7b3c] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["50+", "Active Listings"], ["3", "Countries Served"], ["24-72h", "Listing Turnaround"], ["100%", "Guest Satisfaction"]].map(([v, l]) => (
            <div key={l}>
              <div className="font-['Playfair_Display'] text-3xl font-bold text-white">{v}</div>
              <div className="text-white/70 text-sm mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
