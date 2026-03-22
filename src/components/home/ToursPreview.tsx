"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const tours = [
  {
    title: "Kakum National Park Adventure",
    description: "Walk the legendary canopy walkway high above the rainforest floor, 30m in the air.",
    image: "/images/kakum.jpeg",
    duration: "Full Day",
    groupSize: "2–15",
    price: 350,
    location: "Cape Coast",
  },
  {
    title: "Accra City Cultural Tour",
    description: "Explore Independence Arch, Kwame Nkrumah Mausoleum, and vibrant Makola Market.",
    image: "/images/independence.jpg",
    duration: "Half Day",
    groupSize: "2–10",
    price: 200,
    location: "Accra",
  },
  {
    title: "Wli Waterfalls Expedition",
    description: "Trek through lush greenery to Ghana's highest waterfall — a breathtaking natural wonder.",
    image: "/images/falls.jpeg",
    duration: "Full Day",
    groupSize: "2–12",
    price: 420,
    location: "Volta Region",
  },
];

export default function ToursPreview() {
  return (
    <section className="gcs-section" style={{ background: "var(--white)" }}>
      <div className="gcs-container">
        <div className="section-header">
          <p className="section-subtitle">Explore Ghana</p>
          <h2 className="section-title">Curated Tours &amp; Experiences</h2>
          <p className="section-description">
            Beyond your stay — discover Ghana&apos;s culture, nature, and history with our expert-guided experiences.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "30px" }}>
          {tours.map((tour, i) => (
            <div key={i} className="luxury-card" style={{ overflow: "hidden" }}>
              <div style={{ position: "relative", height: "240px", overflow: "hidden" }}>
                <Image src={tour.image} alt={tour.title} fill style={{ objectFit: "cover", transition: "var(--transition-slow)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
                <div style={{ position: "absolute", bottom: "15px", left: "15px", display: "flex", alignItems: "center", gap: "6px", color: "white", fontSize: "13px" }}>
                  <MapPin style={{ width: "13px", height: "13px", color: "var(--gold-light)" }} />
                  {tour.location}
                </div>
              </div>
              <div style={{ padding: "25px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", marginBottom: "10px", color: "var(--black)" }}>
                  {tour.title}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--medium-gray)", marginBottom: "20px", lineHeight: "1.7" }}>
                  {tour.description}
                </p>
                <div style={{ display: "flex", gap: "20px", padding: "15px 0", borderTop: "1px solid var(--light-gray)", borderBottom: "1px solid var(--light-gray)", marginBottom: "20px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--medium-gray)" }}>
                    <Clock style={{ width: "13px", height: "13px", color: "var(--gold-primary)" }} />
                    {tour.duration}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--medium-gray)" }}>
                    <Users style={{ width: "13px", height: "13px", color: "var(--gold-primary)" }} />
                    {tour.groupSize} people
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: "var(--gold-primary)" }}>
                      {formatCurrency(tour.price)}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--medium-gray)", marginLeft: "4px" }}>/ person</span>
                  </div>
                  <Link href="/tours" className="btn btn-primary" style={{ padding: "10px 22px", fontSize: "13px" }}>
                    Book Tour
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/tours" className="btn btn-outline">
            Explore All Tours →
          </Link>
        </div>
      </div>
    </section>
  );
}
