"use client";

import Image from "next/image";
import Link from "next/link";
import { Target, Eye, Award, Leaf, Zap, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import AnimateIn from "@/components/ui/AnimateIn";

const timelineData = [
  { year: "2023", titleKey: "about_tl1_title", descKey: "about_tl1_desc" },
  { year: "2023", titleKey: "about_tl2_title", descKey: "about_tl2_desc" },
  { year: "2024", titleKey: "about_tl3_title", descKey: "about_tl3_desc" },
  { year: "2024", titleKey: "about_tl4_title", descKey: "about_tl4_desc" },
  { year: "2025", titleKey: "about_tl5_title", descKey: "about_tl5_desc" },
];

const valuesData = [
  { icon: <Award className="h-6 w-6" />, titleKey: "about_val1_title", descKey: "about_val1_desc" },
  { icon: <Zap className="h-6 w-6" />, titleKey: "about_val2_title", descKey: "about_val2_desc" },
  { icon: <Heart className="h-6 w-6" />, titleKey: "about_val3_title", descKey: "about_val3_desc" },
  { icon: <Leaf className="h-6 w-6" />, titleKey: "about_val4_title", descKey: "about_val4_desc" },
];

const testimonialsData = [
  { name: "Sarah K.", country: "UK", rating: 5, textKey: "about_test1_text" },
  { name: "Michael A.", country: "USA", rating: 5, textKey: "about_test2_text" },
  { name: "Amina B.", country: "France", rating: 5, textKey: "about_test3_text" },
];

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <>
      {/* Hero Banner */}
      <div className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: "url('/images/h3.jpg')" }} />
        <div className="page-hero-overlay" />
        <div className="page-hero-content gcs-container">
          <p className="section-subtitle" style={{ marginBottom: "12px" }}>{t("about_hero_sub")}</p>
          <h1>{t("about_hero_h1")}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "17px", marginBottom: "20px", maxWidth: "520px" }}>
            {t("about_hero_desc")}
          </p>
          <nav className="breadcrumb">
            <Link href="/" className="hover:text-[#c9a961] transition-colors">Home</Link>
            <span>/</span><span style={{ color: "rgba(255,255,255,0.8)" }}>About</span>
          </nav>
        </div>
      </div>

      {/* Company Intro */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <AnimateIn direction="left">
            <div>
              <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">{t("about_who_badge")}</p>
              <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a] mb-6">
                {t("about_who_h2")}
              </h2>
              <div className="space-y-4 text-[#343a40] leading-relaxed">
                <p>{t("about_body1")}</p>
                <p>{t("about_body2")}</p>
                <p>{t("about_body3")}</p>
              </div>
            </div>
            </AnimateIn>
            <AnimateIn direction="right" delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <Image src="/images/h1.jpg" alt="Luxury interior" fill className="object-cover" />
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden mt-8">
                <Image src="/images/h4.jpg" alt="Premium amenities" fill className="object-cover" />
              </div>
            </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-[#f8f9fa]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">Milestones</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">{t("about_timeline_h2")}</h2>
            <div className="gold-divider mt-4" />
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#c9a961] to-[#c9a961]/10" />
            <div className="space-y-8">
              {timelineData.map((item, i) => (
                <AnimateIn key={i} delay={i * 0.1}>
                <div className="relative flex gap-8 items-start">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-[#c9a961] font-semibold text-sm">{item.year}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-[#c9a961] border-4 border-white shadow-md flex-shrink-0 mt-1 z-10" />
                  <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-[#e9ecef]">
                    <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-2">{t(item.titleKey)}</h3>
                    <p className="text-[#6c757d] text-sm">{t(item.descKey)}</p>
                  </div>
                </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <AnimateIn>
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Mission & Vision */}
            <div>
              <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">{t("about_purpose_badge")}</p>
              <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a] mb-8">{t("about_mission_vision_h2")}</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#c9a961]/10 flex items-center justify-center text-[#c9a961] flex-shrink-0">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a1a1a] mb-2">{t("about_mission_label")}</h3>
                    <p className="text-[#6c757d] text-sm leading-relaxed">{t("about_mission_text")}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#c9a961]/10 flex items-center justify-center text-[#c9a961] flex-shrink-0">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a1a1a] mb-2">{t("about_vision_label")}</h3>
                    <p className="text-[#6c757d] text-sm leading-relaxed">{t("about_vision_text")}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Values */}
            <div>
              <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">{t("about_values_badge")}</p>
              <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a] mb-8">{t("about_values_h2")}</h2>
              <div className="grid grid-cols-2 gap-4">
                {valuesData.map((v) => (
                  <div key={v.titleKey} className="p-5 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#c9a961]/30 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-[#c9a961]/10 flex items-center justify-center text-[#c9a961] mb-3">
                      {v.icon}
                    </div>
                    <h3 className="font-semibold text-[#1a1a1a] mb-1">{t(v.titleKey)}</h3>
                    <p className="text-[#6c757d] text-xs leading-relaxed">{t(v.descKey)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </AnimateIn>

      {/* Testimonials */}
      <section className="section-padding bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-3">Guest Stories</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a]">{t("about_testimonials_h2")}</h2>
            <div className="gold-divider mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialsData.map((item, idx) => (
              <AnimateIn key={item.name} delay={idx * 0.12}>
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-[#e9ecef]">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <span key={i} className="text-[#c9a961]">★</span>
                  ))}
                </div>
                <p className="text-[#343a40] italic mb-5 leading-relaxed">&ldquo;{t(item.textKey)}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white font-bold text-sm">
                    {item.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a] text-sm">{item.name}</p>
                    <p className="text-[#6c757d] text-xs">{item.country}</p>
                  </div>
                </div>
              </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#9a7b3c] via-[#c9a961] to-[#9a7b3c] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-['Playfair_Display'] text-4xl font-bold text-white mb-4">{t("about_cta_h2")}</h2>
          <p className="text-white/80 mb-8">{t("about_cta_desc")}</p>
          <Link href="/stays" className="inline-flex items-center gap-2 bg-white text-[#9a7b3c] font-semibold px-10 py-4 rounded-full hover:bg-[#f8f9fa] transition-colors shadow-lg text-sm">
            {t("about_cta_btn")}
          </Link>
        </div>
      </section>
    </>
  );
}
