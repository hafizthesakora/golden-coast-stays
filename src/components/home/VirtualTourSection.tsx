"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function VirtualTourSection() {
  const { t } = useI18n();
  const features = [
    { icon: "🥽", key: "vts_feat_vr" },
    { icon: "⛶", key: "vts_feat_full" },
    { icon: "📱", key: "vts_feat_mobile" },
    { icon: "▶", key: "vts_feat_hd" },
  ];

  const textRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [textVis, setTextVis] = useState(false);
  const [previewVis, setPreviewVis] = useState(false);

  useEffect(() => {
    const makeObs = (setter: (v: boolean) => void) =>
      new IntersectionObserver(([e]) => { if (e.isIntersecting) setter(true); }, { threshold: 0.12 });

    const obs1 = makeObs(setTextVis);
    const obs2 = makeObs(setPreviewVis);
    if (textRef.current) obs1.observe(textRef.current);
    if (previewRef.current) obs2.observe(previewRef.current);
    return () => { obs1.disconnect(); obs2.disconnect(); };
  }, []);

  return (
    <section className="gcs-section virtual-tour-section">
      <div className="virtual-tour-bg" />
      <div className="gcs-container">
        <div className="virtual-tour-content">
          {/* Text side */}
          <div
            ref={textRef}
            className="virtual-tour-text"
            style={{
              opacity: textVis ? 1 : 0,
              transform: textVis ? "translateX(0)" : "translateX(-40px)",
              transition: "opacity 0.8s ease, transform 0.8s ease",
            }}
          >
            <p className="section-subtitle">{t("vts_badge")}</p>
            <h2>{t("vts_h2")}</h2>
            <p>{t("vts_desc")}</p>
            <div className="tour-features">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="tour-feature"
                  style={{
                    opacity: textVis ? 1 : 0,
                    transform: textVis ? "translateX(0)" : "translateX(-20px)",
                    transition: `opacity 0.5s ease ${0.3 + i * 0.08}s, transform 0.5s ease ${0.3 + i * 0.08}s`,
                  }}
                >
                  <span className="tour-feature-icon" style={{ fontSize: "20px" }}>{f.icon}</span>
                  <span>{t(f.key)}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                opacity: textVis ? 1 : 0,
                transition: "opacity 0.6s ease 0.7s",
              }}
            >
              <Link href="/virtual-tours" className="btn btn-primary">
                🥽 {t("vts_btn")}
              </Link>
            </div>
          </div>

          {/* Image side */}
          <div
            ref={previewRef}
            className="virtual-tour-preview"
            style={{
              opacity: previewVis ? 1 : 0,
              transform: previewVis ? "translateX(0)" : "translateX(40px)",
              transition: "opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800"
              alt="Virtual Tour Preview"
            />
            <Link href="/virtual-tours" className="tour-play-btn" style={{ fontSize: "36px", color: "white", textDecoration: "none" }}>
              ▶
            </Link>
            <div className="tour-360-badge">
              <span style={{ color: "var(--gold-primary)" }}>↻</span>
              <span>Virtual Tour</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
