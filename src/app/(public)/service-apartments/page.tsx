"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const heroImages = ["/images/h1.jpg", "/images/h2.jpg", "/images/h3.jpg"];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function ServiceApartmentsPage() {
  const { t } = useI18n();
  const [heroSlide, setHeroSlide] = useState(0);
  const [expSlide, setExpSlide] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const servicesGridRef = useRef<HTMLDivElement>(null);
  const benefitsGridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [servicesVisible, setServicesVisible] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(false);

  /* ── data (uses t() so they re-render on lang change) ── */
  const services = [
    { emoji: "📡", title: t("sa_svc1_title"), desc: t("sa_svc1_desc") },
    { emoji: "📸", title: t("sa_svc2_title"), desc: t("sa_svc2_desc") },
    { emoji: "🎁", title: t("sa_svc3_title"), desc: t("sa_svc3_desc") },
    { emoji: "🤝", title: t("sa_svc4_title"), desc: t("sa_svc4_desc") },
    { emoji: "👥", title: t("sa_svc5_title"), desc: t("sa_svc5_desc") },
    { emoji: "📊", title: t("sa_svc6_title"), desc: t("sa_svc6_desc") },
  ];

  const experiences = [
    {
      icon: "🏨", title: "In-Room Add-Ons",
      items: ["Candlelit setup", "Welcome drinks", "Fresh flower arrangements", "Luxury spa kits", "Premium amenities", "Custom minibar"],
    },
    {
      icon: "🍽️", title: "Dining Experiences",
      items: ["Sunset private dinner", "Weekend brunch with live music", "Private chef demonstrations", "Wine tastings", "Local cuisine tours", "Beachfront BBQ"],
    },
    {
      icon: "🎉", title: "Activities & Entertainment",
      items: ["Traditional drumming & dance", "Beach yoga sessions", "Painting & cocktails", "Pool parties", "Live music nights", "Wellness workshops"],
    },
    {
      icon: "🗺️", title: "Tour Packages",
      items: ["Cape Coast Castle tour", "Kakum Canopy Walk", "Cycling adventures", "Craft market visits", "Wli Waterfalls", "Village culture experiences"],
    },
  ];

  const benefits = [
    { icon: "✓", title: t("sa_b1_title"), desc: t("sa_b1_desc") },
    { icon: "🛡️", title: t("sa_b2_title"), desc: t("sa_b2_desc") },
    { icon: "📈", title: t("sa_b3_title"), desc: t("sa_b3_desc") },
    { icon: "📊", title: t("sa_b4_title"), desc: t("sa_b4_desc") },
    { icon: "⚡", title: t("sa_b5_title"), desc: t("sa_b5_desc") },
    { icon: "⭐", title: t("sa_b6_title"), desc: t("sa_b6_desc") },
  ];

  const properties = [
    { title: "Premium Suite", img: "/images/h1.jpg" },
    { title: "Ocean View", img: "/images/h2.jpg" },
    { title: "Pool Villa", img: "/images/h3.jpg" },
    { title: "Penthouse", img: "/images/h4.jpg" },
    { title: "Garden Suite", img: "/images/h5.jpg" },
  ];

  /* ── Timers ── */
  useEffect(() => {
    const timer = setInterval(() => setHeroSlide(s => (s + 1) % heroImages.length), 3500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setExpSlide(s => (s + 1) % experiences.length), 7000);
    return () => clearInterval(timer);
  }, [experiences.length]);

  /* ── Scroll-triggered animations ── */
  useEffect(() => {
    const makeObserver = (setter: (v: boolean) => void) =>
      new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setter(true); }, { threshold: 0.12 });

    const sObs = makeObserver(setServicesVisible);
    const bObs = makeObserver(setBenefitsVisible);
    if (servicesGridRef.current) sObs.observe(servicesGridRef.current);
    if (benefitsGridRef.current) bObs.observe(benefitsGridRef.current);
    return () => { sObs.disconnect(); bObs.disconnect(); };
  }, []);

  /* ── Draggable gallery ── */
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (galleryRef.current?.offsetLeft ?? 0));
    setScrollLeft(galleryRef.current?.scrollLeft ?? 0);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !galleryRef.current) return;
    e.preventDefault();
    galleryRef.current.scrollLeft = scrollLeft - (e.pageX - galleryRef.current.offsetLeft - startX);
  };
  const stopDrag = () => setIsDragging(false);

  return (
    <>
      {/* ── HERO ── split-screen with slanted image panel */}
      <div className="sa-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
        {/* Left — text */}
        <div className="sa-hero-text" style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "120px 60px 80px", background: "white", position: "relative", zIndex: 1,
        }}>
          <p style={{
            fontSize: "13px", fontWeight: 700, letterSpacing: "3px",
            textTransform: "uppercase", color: "var(--gold-primary)", marginBottom: "20px",
          }}>
            {t("sa_badge")}
          </p>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
            fontWeight: 800, color: "#2C2C2C", lineHeight: 1.15, marginBottom: "24px",
          }}>
            {t("sa_hero_h1a")}{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--gold-primary), var(--gold-dark))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              {t("sa_hero_h1b")}
            </span>
          </h1>
          <p style={{ fontSize: "17px", color: "#6B6B6B", lineHeight: 1.9, marginBottom: "36px", maxWidth: "460px" }}>
            {t("sa_hero_desc")}
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <a href="#services" className="btn btn-primary">{t("sa_explore")}</a>
            <Link href="/onboarding" className="btn btn-outline">{t("sa_getstarted")}</Link>
          </div>
        </div>

        {/* Right — image carousel with slant */}
        <div className="sa-hero-img" style={{
          position: "relative", overflow: "hidden",
          clipPath: "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)",
        }}>
          {heroImages.map((src, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              opacity: heroSlide === i ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(154,123,60,0.3) 100%)" }} />
            </div>
          ))}
          {/* Dot indicators */}
          <div style={{ position: "absolute", bottom: "24px", right: "24px", display: "flex", gap: "8px", zIndex: 2 }}>
            {heroImages.map((_, i) => (
              <button key={i} onClick={() => setHeroSlide(i)} style={{
                width: heroSlide === i ? "28px" : "10px", height: "10px", borderRadius: "5px",
                background: heroSlide === i ? "var(--gold-primary)" : "rgba(255,255,255,0.5)",
                border: "none", cursor: "pointer", transition: "all 0.3s",
              }} />
            ))}
          </div>
          {/* Scroll hint */}
          <div style={{
            position: "absolute", bottom: "40px", left: "40px", zIndex: 2,
            color: "rgba(255,255,255,0.7)", fontSize: "11px", letterSpacing: "2px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          }}>
            <span>{t("sa_scroll")}</span>
            <div style={{ width: "2px", height: "30px", background: "rgba(255,255,255,0.4)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "50%", background: "var(--gold-primary)", animation: "slideDown 1.5s ease infinite" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background: "var(--black)", padding: "50px 0" }}>
        <div className="gcs-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", textAlign: "center" }}>
            {[
              { value: 50, suffix: "+", label: t("sa_stat_props") },
              { value: 94, suffix: "%", label: t("sa_stat_occ") },
              { value: 7, suffix: " days", label: t("sa_stat_days") },
              { value: 4, suffix: ".9★", label: t("sa_stat_rating") },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800,
                  background: "linear-gradient(135deg, var(--gold-primary), var(--gold-dark))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", marginTop: "6px" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHAT WE DO ── with scroll-triggered stagger animation */}
      <section id="services" className="gcs-section" style={{ background: "var(--white)" }}>
        <div className="gcs-container">
          <div className="section-header">
            <p className="section-subtitle">{t("sa_what_sub")}</p>
            <h2 className="section-title">{t("sa_what_h2")}</h2>
            <p className="section-description">{t("sa_what_desc")}</p>
          </div>
          <div
            ref={servicesGridRef}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px" }}
          >
            {services.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  border: "1px solid var(--light-gray)",
                  borderRadius: "var(--radius-lg)",
                  padding: "36px 28px",
                  position: "relative",
                  overflow: "hidden",
                  transition: `opacity 0.65s ease ${i * 0.1}s, transform 0.65s ease ${i * 0.1}s, box-shadow 0.3s, border-color 0.3s`,
                  opacity: servicesVisible ? 1 : 0,
                  transform: servicesVisible ? "translateY(0)" : "translateY(40px)",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-8px)";
                  el.style.boxShadow = "var(--shadow-gold)";
                  el.style.borderColor = "var(--gold-light)";
                  const bar = el.querySelector(".sa-bar") as HTMLElement;
                  if (bar) bar.style.width = "100%";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = servicesVisible ? "translateY(0)" : "translateY(40px)";
                  el.style.boxShadow = "";
                  el.style.borderColor = "var(--light-gray)";
                  const bar = el.querySelector(".sa-bar") as HTMLElement;
                  if (bar) bar.style.width = "0";
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "18px" }}>{s.emoji}</div>
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "19px", marginBottom: "12px", color: "var(--black)" }}>
                  {s.title}
                </h4>
                <p style={{ fontSize: "14px", color: "var(--medium-gray)", lineHeight: 1.8 }}>{s.desc}</p>
                {/* Animated gold bar */}
                <div
                  className="sa-bar"
                  style={{
                    position: "absolute", bottom: 0, left: 0,
                    width: "0", height: "3px",
                    background: "linear-gradient(90deg, var(--gold-dark), var(--gold-primary))",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE LAYERING ── */}
      <section className="gcs-section" style={{ background: "var(--off-white)" }}>
        <div className="gcs-container">
          <div className="section-header">
            <p className="section-subtitle">{t("sa_exp_sub")}</p>
            <h2 className="section-title">{t("sa_exp_h2")}</h2>
            <p className="section-description">{t("sa_exp_desc")}</p>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "40px", flexWrap: "wrap" }}>
            {experiences.map((e, i) => (
              <button
                key={i}
                onClick={() => setExpSlide(i)}
                style={{
                  padding: "10px 24px", borderRadius: "var(--radius-full)",
                  fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500,
                  cursor: "pointer", transition: "var(--transition-medium)",
                  background: expSlide === i ? "var(--gold-primary)" : "white",
                  color: expSlide === i ? "white" : "var(--dark-gray)",
                  border: expSlide === i ? "none" : "1px solid var(--light-gray)",
                  boxShadow: expSlide === i ? "var(--shadow-gold)" : "none",
                }}
              >
                {e.icon} {e.title}
              </button>
            ))}
          </div>
          <div className="sa-exp-content" style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "40px 48px", boxShadow: "var(--shadow-sm)" }}>
            <div className="sa-exp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {experiences[expSlide].items.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--off-white)",
                }}>
                  <span style={{ color: "var(--gold-primary)", fontWeight: 700, fontSize: "16px" }}>✓</span>
                  <span style={{ fontSize: "15px", color: "var(--dark-gray)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR PROPERTIES (draggable gallery) ── */}
      <section className="gcs-section" style={{ background: "var(--white)" }}>
        <div className="gcs-container">
          <div className="section-header">
            <p className="section-subtitle">{t("sa_portfolio_sub")}</p>
            <h2 className="section-title">{t("sa_portfolio_h2")}</h2>
            <p className="section-description">{t("sa_portfolio_desc")}</p>
          </div>
          <div
            ref={galleryRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            style={{
              display: "flex", gap: "24px", overflowX: "auto", scrollbarWidth: "none",
              cursor: isDragging ? "grabbing" : "grab", paddingBottom: "10px", userSelect: "none",
            }}
          >
            {properties.map((p, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 320px", height: "420px", borderRadius: "var(--radius-lg)",
                  overflow: "hidden", position: "relative",
                  border: "2px solid var(--gold-light)",
                  boxShadow: "0 15px 40px rgba(212,175,55,0.2)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.02)"; el.style.boxShadow = "0 20px 50px rgba(212,175,55,0.4)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = "0 15px 40px rgba(212,175,55,0.2)"; }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px", background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}>
                  <p style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600 }}>{p.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY TRUST US ── with scroll-triggered stagger animation */}
      <section className="gcs-section" style={{ background: "var(--off-white)" }}>
        <div className="gcs-container">
          <div className="section-header">
            <p className="section-subtitle">{t("sa_trust_sub")}</p>
            <h2 className="section-title">{t("sa_trust_h2")}</h2>
            <p className="section-description">{t("sa_trust_desc")}</p>
          </div>
          <div
            ref={benefitsGridRef}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px" }}
          >
            {benefits.map((b, i) => (
              <div
                key={i}
                style={{
                  background: "white", borderRadius: "var(--radius-lg)", padding: "36px 28px",
                  boxShadow: "var(--shadow-sm)",
                  transition: `opacity 0.65s ease ${i * 0.1}s, transform 0.65s ease ${i * 0.1}s, box-shadow 0.3s`,
                  opacity: benefitsVisible ? 1 : 0,
                  transform: benefitsVisible ? "translateY(0)" : "translateY(40px)",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-8px)"; el.style.boxShadow = "var(--shadow-gold)"; el.style.borderTop = "3px solid var(--gold-primary)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = benefitsVisible ? "translateY(0)" : "translateY(40px)"; el.style.boxShadow = "var(--shadow-sm)"; el.style.borderTop = ""; }}
              >
                <div style={{
                  width: "65px", height: "65px", borderRadius: "50%", background: "var(--gold-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px", marginBottom: "20px", color: "var(--gold-dark)",
                }}>
                  {b.icon}
                </div>
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", marginBottom: "10px", color: "var(--black)" }}>{b.title}</h4>
                <p style={{ fontSize: "14px", color: "var(--medium-gray)", lineHeight: 1.8 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", padding: "100px 0", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/h6.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(50,30,10,0.8) 100%)" }} />
        <div className="gcs-container" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <p className="section-subtitle">{t("sa_cta_sub")}</p>
          <h2 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "clamp(2rem, 4vw, 3.2rem)", marginBottom: "20px" }}>
            {t("sa_cta_h2")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "17px", maxWidth: "560px", margin: "0 auto 36px", lineHeight: 1.8 }}>
            {t("sa_cta_desc")}
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "36px" }}>
            <a href="tel:+233508697753" className="btn btn-primary">📞 {t("sa_cta_btn1")}</a>
            <a href="mailto:support@goldencoaststays.com" className="btn" style={{ border: "2px solid rgba(255,255,255,0.5)", color: "white", background: "transparent" }}>
              ✉ {t("sa_cta_btn2")}
            </a>
          </div>
          <div style={{ display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap", color: "rgba(255,255,255,0.65)", fontSize: "14px" }}>
            <span>📞 +233 50 869 7753</span>
            <span>✉ support@goldencoaststays.com</span>
            <span>🌐 goldencoaststays.com</span>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @media (max-width: 768px) {
          .sa-hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
          .sa-hero-text { padding: 100px 24px 40px !important; justify-content: flex-start !important; }
          .sa-hero-img { clip-path: none !important; height: 280px !important; }
          .sa-exp-content { padding: 24px 16px !important; }
          .sa-exp-grid { grid-template-columns: 1fr !important; }
          [style*="repeat(3, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
          [style*="repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          [style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          [style*="repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </>
  );
}
