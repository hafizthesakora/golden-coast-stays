"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Michael Asante",
    role: "Business Traveler",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    rating: 5,
    text: "Absolutely stunning property! The virtual tour was so accurate — exactly what we expected. The amenities were top-notch and the staff was incredibly helpful.",
  },
  {
    name: "Sarah Johnson",
    role: "Family Vacation",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    rating: 5,
    text: "Perfect for our family vacation! The kids loved the pool and we appreciated the fully equipped kitchen. Will definitely book again for our next visit to Ghana.",
  },
  {
    name: "David Mensah",
    role: "Weekend Getaway",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    rating: 5,
    text: "The booking process was seamless and the property exceeded our expectations. The location was perfect for exploring Accra. Highly recommend Golden Coast Stay!",
  },
];

export default function Testimonials() {
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
          <p className="section-subtitle">Guest Reviews</p>
          <h2 className="section-title">What Our Guests Say</h2>
          <p className="section-description">
            Don&apos;t just take our word for it. Here&apos;s what our guests have to say about their experience.
          </p>
        </div>

        <div ref={gridRef} className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testimonial-card"
              style={{
                opacity: gridVis ? 1 : 0,
                transform: gridVis ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.65s ease ${i * 0.12}s, transform 0.65s ease ${i * 0.12}s`,
              }}
            >
              <div className="testimonial-rating">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} style={{ color: "var(--gold-primary)", fontSize: "18px" }}>★</span>
                ))}
              </div>
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.avatar} alt={t.name} />
                <div>
                  <h5>{t.name}</h5>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
