"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Users, MapPin, Calendar, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import AnimateIn from "@/components/ui/AnimateIn";
import { useI18n } from "@/lib/i18n";

const tours = [
  {
    id: 1,
    title: "Kakum National Park Adventure",
    description: "Walk the legendary canopy walkway 30m above the rainforest floor. Experience Ghana's most iconic natural attraction with our expert guides. Includes transportation, entrance fee, and a local lunch.",
    image: "/images/kakum.jpeg",
    images: ["/images/kakum.jpeg", "/images/kakum1.jpeg", "/images/kakum2.jpeg"],
    duration: "Full Day (8AM – 6PM)",
    groupSize: "2–15 people",
    price: 350,
    location: "Cape Coast, Central Region",
    includes: ["Transportation from Accra", "Expert guide", "Entrance fees", "Local lunch", "Water & snacks"],
    highlights: ["Canopy walkway (30m high)", "Birdwatching", "Forest hike", "Local culture visit"],
  },
  {
    id: 2,
    title: "Accra City Cultural Tour",
    description: "Explore the soul of Accra — from the historic Independence Arch and Kwame Nkrumah Mausoleum to the vibrant Makola Market. Discover the art, food, and history that make Ghana's capital so unique.",
    image: "/images/independence.jpg",
    images: ["/images/independence.jpg", "/images/kwameNkruma.jpg"],
    duration: "Half Day (9AM – 2PM)",
    groupSize: "2–10 people",
    price: 200,
    location: "Accra, Greater Accra",
    includes: ["Private vehicle", "Local guide", "Museum entrance", "Traditional meal", "Market tour"],
    highlights: ["Independence Arch", "Kwame Nkrumah Mausoleum", "Makola Market", "Arts Centre"],
  },
  {
    id: 3,
    title: "Wli Waterfalls Expedition",
    description: "Trek through lush Ghanaian rainforest to reach Wli Waterfalls — the highest waterfall in West Africa. A breathtaking full-day adventure through stunning natural scenery and local communities.",
    image: "/images/falls.jpeg",
    images: ["/images/falls.jpeg"],
    duration: "Full Day (7AM – 7PM)",
    groupSize: "2–12 people",
    price: 420,
    location: "Volta Region",
    includes: ["Transport", "Expert guide", "Entrance fees", "Packed lunch", "Photography stop"],
    highlights: ["2-hour guided trek", "Wli Upper Falls", "Butterfly sanctuary", "Local village visit"],
  },
  {
    id: 4,
    title: "Cape Coast Castle History Tour",
    description: "A deeply moving journey through Ghana's history at Cape Coast Castle — a UNESCO World Heritage site. Walk through the infamous 'Door of No Return' and learn the untold stories of the transatlantic slave trade.",
    image: "/images/h3.jpg",
    images: ["/images/h3.jpg"],
    duration: "Full Day (8AM – 5PM)",
    groupSize: "2–20 people",
    price: 280,
    location: "Cape Coast, Central Region",
    includes: ["Transportation", "Professional historian guide", "Castle entrance", "Documentary screening", "Lunch"],
    highlights: ["Cape Coast Castle", "Door of No Return", "Elmina Castle", "Cultural village"],
  },
];

interface TourRegistrationForm {
  tourId: number | null;
  tourTitle: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  tourDate: string;
  groupSize: number;
  accommodation: boolean;
  specialNeeds: string;
}

export default function ToursPage() {
  const { t } = useI18n();
  const [selectedTour, setSelectedTour] = useState<(typeof tours)[0] | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [form, setForm] = useState<TourRegistrationForm>({ tourId: null, tourTitle: "", fullName: "", email: "", phone: "", country: "", tourDate: "", groupSize: 1, accommodation: false, specialNeeds: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const openBooking = (tour: (typeof tours)[0]) => {
    setForm(f => ({ ...f, tourId: tour.id, tourTitle: tour.title }));
    setShowBookingModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  return (
    <>
      {/* Tour Detail Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedTour(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative h-64">
              <Image src={selectedTour.image} alt={selectedTour.title} fill className="object-cover rounded-t-2xl" />
              <button onClick={() => setSelectedTour(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-7">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-2">{selectedTour.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-[#6c757d] mb-5">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#c9a961]" />{selectedTour.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#c9a961]" />{selectedTour.duration}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-[#c9a961]" />{selectedTour.groupSize}</span>
              </div>
              <p className="text-[#343a40] leading-relaxed mb-6">{selectedTour.description}</p>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-3">{t("tours_whats_included")}</h3>
                  <ul className="space-y-2">
                    {selectedTour.includes.map(i => <li key={i} className="flex items-center gap-2 text-sm text-[#343a40]"><CheckCircle className="h-3.5 w-3.5 text-[#c9a961]" />{i}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-3">{t("tours_highlights")}</h3>
                  <ul className="space-y-2">
                    {selectedTour.highlights.map(h => <li key={h} className="flex items-center gap-2 text-sm text-[#343a40]"><span className="w-1.5 h-1.5 rounded-full bg-[#c9a961]" />{h}</li>)}
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">{formatCurrency(selectedTour.price)}</span>
                  <span className="text-[#6c757d] text-sm ml-1">{t("tours_per_person")}</span>
                </div>
                <Button onClick={() => { setSelectedTour(null); openBooking(selectedTour); }} variant="gold" size="lg">
                  {t("tours_book_this")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">{t("tours_register_h2")}</h2>
                <button onClick={() => setShowBookingModal(false)} className="text-[#6c757d] hover:text-[#1a1a1a]"><X className="h-5 w-5" /></button>
              </div>
              {form.tourTitle && <p className="text-[#c9a961] text-sm font-medium mb-5">{form.tourTitle}</p>}

              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-8 w-8 text-green-500" /></div>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a] mb-2">{t("tours_success_h3")}</h3>
                  <p className="text-[#6c757d] text-sm">{t("tours_success_p")}</p>
                  <button onClick={() => { setShowBookingModal(false); setSubmitted(false); }} className="mt-5 text-[#c9a961] text-sm font-medium hover:underline">{t("tours_success_close")}</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_fullname")} *</label><input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" /></div>
                    <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_email_label")} *</label><input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_phone_label")} *</label><input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" /></div>
                    <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_country_label")}</label><input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_date_label")}</label><input type="date" value={form.tourDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm(f => ({ ...f, tourDate: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" /></div>
                    <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_group_label")}</label><input type="number" min={1} max={20} value={form.groupSize} onChange={e => setForm(f => ({ ...f, groupSize: parseInt(e.target.value) }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" /></div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.checked }))} className="accent-[#c9a961]" />
                    <span className="text-sm text-[#343a40]">{t("tours_accom_label")}</span>
                  </label>
                  <div><label className="block text-xs font-medium text-[#343a40] mb-1">{t("tours_special_label")}</label><textarea rows={3} value={form.specialNeeds} onChange={e => setForm(f => ({ ...f, specialNeeds: e.target.value }))} placeholder={t("tours_special_ph")} className="w-full px-3 py-2 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] resize-none" /></div>
                  <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
                    {loading ? t("tours_submitting") : t("tours_submit_btn")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: "url('/images/kakum.jpeg')" }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content gcs-container">
          <p className="section-subtitle" style={{ marginBottom: "12px" }}>{t("tours_page_sub")}</p>
          <h1>{t("tours_page_h1")}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "17px", marginBottom: "20px", maxWidth: "520px" }}>
            {t("tours_page_desc")}
          </p>
          <nav className="breadcrumb">
            <a href="/">Home</a><span>/</span><span style={{ color: "rgba(255,255,255,0.8)" }}>Tours</span>
          </nav>
        </div>
      </div>

      {/* Tour Cards */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tours.map((tour, idx) => (
            <AnimateIn key={tour.id} delay={idx * 0.1}>
            <article className="luxury-card group overflow-hidden">
              <div className="relative h-64 overflow-hidden">
                <Image src={tour.image} alt={tour.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" />{tour.duration}</span>
                    <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1"><Users className="h-3 w-3" />{tour.groupSize}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1.5 text-[#6c757d] text-sm mb-3">
                  <MapPin className="h-3.5 w-3.5 text-[#c9a961]" />{tour.location}
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl mb-3 group-hover:text-[#c9a961] transition-colors">
                  {tour.title}
                </h3>
                <p className="text-[#6c757d] text-sm leading-relaxed mb-5 line-clamp-3">{tour.description}</p>

                {/* Includes preview */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {tour.includes.slice(0, 3).map(i => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#f8f9fa] text-[#343a40] px-2.5 py-1 rounded-full border border-[#e9ecef]">
                      <CheckCircle className="h-3 w-3 text-[#c9a961]" />{i}
                    </span>
                  ))}
                  {tour.includes.length > 3 && <span className="text-xs text-[#6c757d] px-2 py-1">+{tour.includes.length - 3} more</span>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#e9ecef]">
                  <div>
                    <span className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">{formatCurrency(tour.price)}</span>
                    <span className="text-[#6c757d] text-sm ml-1">{t("tours_per_person")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setSelectedTour(tour)} variant="gold-outline" size="sm">{t("tours_view_details")}</Button>
                    <Button onClick={() => openBooking(tour)} variant="gold" size="sm"><Calendar className="h-3.5 w-3.5" /> {t("tours_book_btn")}</Button>
                  </div>
                </div>
              </div>
            </article>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <AnimateIn>
      <div className="bg-gradient-to-r from-[#9a7b3c] via-[#c9a961] to-[#9a7b3c] py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-['Playfair_Display'] text-4xl font-bold text-white mb-4">{t("tours_custom_h2")}</h2>
          <p className="text-white/80 mb-8">{t("tours_custom_desc")}</p>
          <a href="/contact" className="inline-flex items-center gap-2 bg-white text-[#9a7b3c] font-semibold px-10 py-4 rounded-full hover:bg-[#f8f9fa] transition-colors shadow-lg text-sm">
            {t("tours_custom_btn")}
          </a>
        </div>
      </div>
      </AnimateIn>
    </>
  );
}
