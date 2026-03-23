"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function GalleryStrip() {
  const { t } = useI18n();
  const images = [
    { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200", alt: "Luxury Interior", captionKey: "gal_cap_interiors" },
    { src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", alt: "Pool View", captionKey: "gal_cap_pools" },
    { src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", alt: "Bedroom", captionKey: "gal_cap_bedrooms" },
    { src: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800", alt: "Kitchen", captionKey: "gal_cap_kitchens" },
    { src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800", alt: "Balcony", captionKey: "gal_cap_views" },
  ];

  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [headerVis, setHeaderVis] = useState(false);
  const [gridVis, setGridVis] = useState(false);
  const [touchedIdx, setTouchedIdx] = useState<number | null>(null);

  useEffect(() => {
    const makeObs = (setter: (v: boolean) => void) =>
      new IntersectionObserver(([e]) => { if (e.isIntersecting) setter(true); }, { threshold: 0.1 });

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
          <p className="section-subtitle">{t("gal_strip_sub")}</p>
          <h2 className="section-title">{t("gal_strip_h2")}</h2>
          <p className="section-description">{t("gal_strip_desc")}</p>
        </div>

        <div
          ref={gridRef}
          className="gallery-grid"
          style={{
            opacity: gridVis ? 1 : 0,
            transform: gridVis ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className={`gallery-item${touchedIdx === i ? " gallery-item--touched" : ""}`}
              onClick={() => setTouchedIdx(touchedIdx === i ? null : i)}
            >
              <Image src={img.src} alt={img.alt} fill style={{ objectFit: "cover" }} />
              <div className="gallery-overlay">
                <h4>{t(img.captionKey)}</h4>
              </div>
              <div className="gallery-zoom">+</div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center", marginTop: "40px",
            opacity: gridVis ? 1 : 0,
            transition: "opacity 0.7s ease 0.4s",
          }}
        >
          <Link href="/gallery" className="btn btn-outline">
            {t("gal_strip_btn")}
          </Link>
        </div>
      </div>
    </section>
  );
}
