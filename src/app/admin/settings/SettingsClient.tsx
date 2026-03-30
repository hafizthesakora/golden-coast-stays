"use client";

import { useState, useEffect } from "react";

interface SettingsClientProps {
  initialSettings: Record<string, string>;
}

const DEFAULTS: Record<string, string> = {
  site_name: "Golden Coast Stay",
  site_tagline: "Premium Short-Term Rentals · Accra, Ghana",
  contact_email: "hello@goldencoaststay.com",
  contact_phone: "+233 50 869 7753",
  contact_whatsapp: "+233 50 869 7753",
  social_instagram: "",
  social_facebook: "",
  social_twitter: "",
  feature_virtual_tours: "true",
  feature_reviews: "true",
  feature_booking: "true",
  booking_min_nights: "1",
  booking_max_advance_days: "365",
  booking_currency: "GHS",
};

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    ...DEFAULTS,
    ...initialSettings,
  }));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(key: string) {
    setForm((prev) => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = Object.entries(form).map(([key, value]) => ({ key, value }));
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast(true);
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] placeholder:text-[#adb5bd]";

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-500 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          Settings saved successfully
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 sticky top-0 z-20 shadow-sm">
        <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Configuration</p>
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">Settings</h1>
      </div>

      <div className="p-6 lg:p-8">
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Section 1 — Site Info */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f0f0f0]">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#c9a961] to-[#9a7b3c]" />
            <h2 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-lg">Site Info</h2>
          </div>
          <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Site Name</label>
              <input
                value={form.site_name}
                onChange={(e) => set("site_name", e.target.value)}
                placeholder={DEFAULTS.site_name}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Tagline</label>
              <input
                value={form.site_tagline}
                onChange={(e) => set("site_tagline", e.target.value)}
                placeholder={DEFAULTS.site_tagline}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                placeholder={DEFAULTS.contact_email}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input
                value={form.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
                placeholder={DEFAULTS.contact_phone}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">WhatsApp Number</label>
              <input
                value={form.contact_whatsapp}
                onChange={(e) => set("contact_whatsapp", e.target.value)}
                placeholder={DEFAULTS.contact_whatsapp}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Social Links */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f0f0f0]">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#c9a961] to-[#9a7b3c]" />
            <h2 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-lg">Social Links</h2>
          </div>
          <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Instagram URL</label>
              <input
                value={form.social_instagram}
                onChange={(e) => set("social_instagram", e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Facebook URL</label>
              <input
                value={form.social_facebook}
                onChange={(e) => set("social_facebook", e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Twitter / X URL</label>
              <input
                value={form.social_twitter}
                onChange={(e) => set("social_twitter", e.target.value)}
                placeholder="https://x.com/yourhandle"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Feature Flags */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f0f0f0]">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#c9a961] to-[#9a7b3c]" />
            <h2 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-lg">Feature Flags</h2>
          </div>
          <div className="px-6 py-6 space-y-5">
            {[
              { key: "feature_virtual_tours", label: "Enable Virtual Tours section" },
              { key: "feature_reviews", label: "Enable Guest Reviews" },
              { key: "feature_booking", label: "Online Booking Active" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#343a40] font-medium">{label}</span>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  role="switch"
                  aria-checked={form[key] === "true"}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    height: "24px",
                    width: "44px",
                    flexShrink: 0,
                    cursor: "pointer",
                    borderRadius: "9999px",
                    border: "2px solid transparent",
                    transition: "background-color 0.2s",
                    outline: "none",
                    background: form[key] === "true" ? "#c9a961" : "#d1d5db",
                  }}
                >
                  <span
                    style={{
                      pointerEvents: "none",
                      display: "inline-block",
                      height: "20px",
                      width: "20px",
                      borderRadius: "9999px",
                      background: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "transform 0.2s ease-in-out",
                      transform: form[key] === "true" ? "translateX(20px)" : "translateX(0px)",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Booking Settings */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f0f0f0]">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#c9a961] to-[#9a7b3c]" />
            <h2 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-lg">Booking Settings</h2>
          </div>
          <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Minimum Nights</label>
              <input
                type="number"
                min={1}
                value={form.booking_min_nights}
                onChange={(e) => set("booking_min_nights", e.target.value)}
                placeholder={DEFAULTS.booking_min_nights}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Max Advance Days</label>
              <input
                type="number"
                min={1}
                value={form.booking_max_advance_days}
                onChange={(e) => set("booking_max_advance_days", e.target.value)}
                placeholder={DEFAULTS.booking_max_advance_days}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Currency</label>
              <select
                value={form.booking_currency}
                onChange={(e) => set("booking_currency", e.target.value)}
                className={inputClass}
              >
                <option value="GHS">GHS — Ghana Cedi</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              "Save All Changes"
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
