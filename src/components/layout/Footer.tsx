"use client";
import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer>
      {/* CTA Banner */}
      <div style={{ background: "linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-primary) 50%, var(--gold-dark) 100%)" }}>
        <div className="gcs-container" style={{ padding: "50px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, color: "white", marginBottom: "6px" }}>
              {t("cta_own")}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>
              {t("cta_partner")}
            </p>
          </div>
          <Link href="/onboarding" style={{
            background: "white", color: "var(--gold-dark)", fontWeight: 600,
            padding: "14px 32px", borderRadius: "var(--radius-full)",
            fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px",
            transition: "var(--transition-medium)", whiteSpace: "nowrap",
          }}>
            {t("cta_list")}
          </Link>
        </div>
      </div>

      {/* Main Footer */}
      <div className="gcs-footer">
        <div className="gcs-container">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <span className="footer-logo-text">Golden Coast Stay</span>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", lineHeight: "1.9", marginBottom: "25px" }}>
                {t("footer_tagline")}
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { icon: <Instagram size={16} />, href: "#" },
                  { icon: <Facebook size={16} />, href: "#" },
                  { icon: <Twitter size={16} />, href: "#" },
                ].map((s, i) => (
                  <a key={i} href={s.href} style={{
                    width: "42px", height: "42px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.6)", transition: "var(--transition-medium)",
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gold-primary)"; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Explore */}
            <div>
              <h4 className="footer-col-title">{t("footer_explore")}</h4>
              {[
                { href: "/stays", label: t("nav_stays") },
                { href: "/service-apartments", label: "Serviced Apartments" },
                { href: "/virtual-tours", label: t("nav_tours") },
                { href: "/gallery", label: t("nav_gallery") },
                { href: "/about", label: t("nav_about") },
                { href: "/contact", label: t("nav_contact") },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>

            {/* Support */}
            <div>
              <h4 className="footer-col-title">{t("footer_support")}</h4>
              {[
                { href: "/privacy", label: t("footer_privacy") },
                { href: "/contact", label: t("footer_help") },
                { href: "/onboarding", label: t("footer_list") },
                { href: "/register", label: t("footer_account") },
                { href: "/login", label: t("footer_signin") },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 className="footer-col-title">{t("footer_contact")}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "14px", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                  <MapPin size={16} style={{ color: "var(--gold-primary)", flexShrink: 0, marginTop: "2px" }} />
                  <span>6, Tetramante Drive, North Legon<br />Accra, Ghana</span>
                </div>
                <a href="tel:+233508697753" style={{ display: "flex", gap: "14px", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                  <Phone size={16} style={{ color: "var(--gold-primary)", flexShrink: 0 }} />
                  +233 50 869 7753
                </a>
                <a href="mailto:support@goldencoaststays.com" style={{ display: "flex", gap: "14px", fontSize: "14px", color: "rgba(255,255,255,0.6)", wordBreak: "break-all" }}>
                  <Mail size={16} style={{ color: "var(--gold-primary)", flexShrink: 0 }} />
                  support@goldencoaststays.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Golden Coast Stay. All rights reserved.</p>
            <div style={{ display: "flex", gap: "30px" }}>
              <Link href="/privacy" style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Privacy Policy</Link>
              <Link href="/contact" style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
