"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Hero() {
  const router = useRouter();
  const { t } = useI18n();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (propertyType) params.set("property_type", propertyType);
    if (guests) params.set("guests", guests);
    router.push(`/stays?${params.toString()}`);
  };

  return (
    <section className="hero-section">
      {/* Background image */}
      <div
        className="hero-bg"
        style={{ backgroundImage: "url('/images/h1.jpg')" }}
      />
      {/* Overlay */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content-wrap">
        <p className="hero-subtitle">{t("hero_subtitle")}</p>
        <h1 className="hero-title">
          {(() => {
            const title = t("hero_title");
            const parts = title.split("Accra");
            return parts.length > 1
              ? <>{parts[0]}<span>Accra</span>{parts[1]}</>
              : <>{title}</>;
          })()}
        </h1>
        <p className="hero-desc">{t("hero_desc")}</p>

        {/* Booking Widget */}
        <div className="booking-widget">
          <form className="booking-form" onSubmit={handleSearch}>
            <div className="booking-field">
              <label>{t("hero_checkin")}</label>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="booking-field">
              <label>{t("hero_checkout")}</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="booking-field">
              <label>{t("hero_type")}</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="">Any Type</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div className="booking-field">
              <label>{t("hero_guests")}</label>
              <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5+ Guests</option>
              </select>
            </div>
            <button type="submit" className="btn-search">
              <Search className="h-4 w-4" />
              {t("hero_search")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
