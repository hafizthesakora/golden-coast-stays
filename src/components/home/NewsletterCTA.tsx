"use client";

import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";
import { useI18n } from "@/lib/i18n";

export default function NewsletterCTA() {
  const { t } = useI18n();
  return (
    <AnimateIn>
      <section className="cta-section">
        <div className="gcs-container">
          <div className="cta-content">
            <h2>{t("ncta_h2")}</h2>
            <p>{t("ncta_desc")}</p>
            <div className="cta-buttons">
              <Link href="/stays" className="btn btn-white">
                {t("ncta_browse")}
              </Link>
              <Link href="/contact" className="btn btn-outline" style={{ borderColor: "white", color: "white" }}>
                {t("ncta_contact")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AnimateIn>
  );
}
