"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function WhoWeServe() {
  const { t } = useI18n();
  const segments = [
    { emoji: "💼", titleKey: "serve_biz_title", descKey: "serve_biz_desc" },
    { emoji: "✈️", titleKey: "serve_diaspora_title", descKey: "serve_diaspora_desc" },
    { emoji: "🏖️", titleKey: "serve_leisure_title", descKey: "serve_leisure_desc" },
    { emoji: "📊", titleKey: "serve_invest_title", descKey: "serve_invest_desc" },
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
    <section className="gcs-section" style={{ background: "var(--white)" }}>
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
          <p className="section-subtitle">{t("serve_sub")}</p>
          <h2 className="section-title">{t("serve_h2")}</h2>
          <p className="section-description">{t("serve_desc")}</p>
        </div>
        <div ref={gridRef} className="market-grid">
          {segments.map((s, i) => (
            <div
              key={i}
              className="market-card"
              style={{
                opacity: gridVis ? 1 : 0,
                transform: gridVis ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
              }}
            >
              <div className="market-icon">
                <div className="icon-circle">{s.emoji}</div>
              </div>
              <h4>{t(s.titleKey)}</h4>
              <p>{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
