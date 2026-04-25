"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, Waves, Car, Bell, UtensilsCrossed, Shield, Zap, Droplets, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Listings",
    desc: "Every property is visited, photographed, and confirmed by our team before going live.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Zap,
    title: "Stable Power Supply",
    desc: "Properties with confirmed 24/7 electricity — generator backup or solar where needed.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Droplets,
    title: "Running Water",
    desc: "Reliable water supply confirmed at every listed property — no surprises on arrival.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Wifi,
    title: "High-Speed WiFi",
    desc: "Fibre or strong LTE confirmed on-site — essential for remote workers and families.",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: UtensilsCrossed,
    title: "Fully Equipped Kitchens",
    desc: "Cook your favourite meals with fully stocked kitchenware and modern appliances.",
    color: "text-[#9a7b3c]",
    bg: "bg-[#c9a961]/10",
  },
  {
    icon: Shield,
    title: "Secure & Gated",
    desc: "24-hour security, gated access, and in-unit safes across our premium properties.",
    color: "text-slate-500",
    bg: "bg-slate-50",
  },
];

export default function WhyChooseUs() {
  const { t } = useI18n();
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [headerVis, setHeaderVis] = useState(false);
  const [gridVis, setGridVis] = useState(false);

  useEffect(() => {
    const makeObs = (setter: (v: boolean) => void) =>
      new IntersectionObserver(([e]) => { if (e.isIntersecting) setter(true); }, { threshold: 0.12 });
    const obs1 = makeObs(setHeaderVis);
    const obs2 = makeObs(setGridVis);
    if (headerRef.current) obs1.observe(headerRef.current);
    if (gridRef.current) obs2.observe(gridRef.current);
    return () => { obs1.disconnect(); obs2.disconnect(); };
  }, []);

  return (
    <section className="gcs-section" style={{ background: "var(--off-white)" }}>
      <div className="gcs-container">
        <div
          ref={headerRef}
          className="section-header"
          style={{
            opacity: headerVis ? 1 : 0,
            transform: headerVis ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <p className="section-subtitle">{t("why_sub")}</p>
          <h2 className="section-title">{t("why_h2")}</h2>
          <p className="section-description">
            We don&apos;t just list beautiful spaces — we verify every detail that matters for a comfortable, reliable stay in Accra.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#e9ecef] p-6 flex items-start gap-4 hover:shadow-md transition-shadow"
              style={{
                opacity: gridVis ? 1 : 0,
                transform: gridVis ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`,
              }}
            >
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <div>
                <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">{f.title}</h4>
                <p className="text-[#6c757d] text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
