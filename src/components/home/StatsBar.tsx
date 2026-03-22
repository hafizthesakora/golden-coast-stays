"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function StatsBar() {
  const { t } = useI18n();
  const stats = [
    { value: "50+", key: "stats_props" },
    { value: "500+", key: "stats_guests" },
    { value: "5", key: "stats_cities" },
    { value: "98%", key: "stats_satisfaction" },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{ background: "var(--black)", padding: "60px 0", borderTop: "1px solid rgba(201,169,97,0.2)", borderBottom: "1px solid rgba(201,169,97,0.2)" }}>
      <div className="gcs-container">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
              }}
            >
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700, marginBottom: "8px",
                background: "linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {s.value}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "2px" }}>
                {t(s.key)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
