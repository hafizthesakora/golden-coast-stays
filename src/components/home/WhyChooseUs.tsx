"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function WhyChooseUs() {
  const { t } = useI18n();
  const amenities = [
    { emoji: "📶", key: "amenity_wifi" },
    { emoji: "🏊", key: "amenity_pool" },
    { emoji: "🚗", key: "amenity_parking" },
    { emoji: "🔔", key: "amenity_concierge" },
    { emoji: "🍳", key: "amenity_kitchen" },
    { emoji: "🛡️", key: "amenity_security" },
  ];

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
          <p className="section-description">{t("why_desc")}</p>
        </div>
        <div ref={gridRef} className="amenities-grid">
          {amenities.map((a, i) => (
            <div
              key={i}
              className="amenity-card"
              style={{
                opacity: gridVis ? 1 : 0,
                transform: gridVis ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.6s ease ${i * 0.09}s, transform 0.6s ease ${i * 0.09}s`,
              }}
            >
              <div className="amenity-icon">{a.emoji}</div>
              <h4>{t(a.key)}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
