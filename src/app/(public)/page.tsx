import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import Hero from "@/components/home/Hero";
import StatsBar from "@/components/home/StatsBar";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import GalleryStrip from "@/components/home/GalleryStrip";
import VirtualTourSection from "@/components/home/VirtualTourSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import WhoWeServe from "@/components/home/WhoWeServe";
import Testimonials from "@/components/home/Testimonials";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Short-Term Rentals in Accra | Premium Serviced Apartments | Golden Coast Stay",
  description:
    "Book professionally managed short-term rentals and serviced apartments in Accra, Ghana. Experience comfort, security, and premium hospitality with Golden Coast Stay.",
};

async function FeaturedPropertiesSection() {
  try {
    const data = await prisma.property.findMany({
      where: { featured: true, status: "available" },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    return <FeaturedProperties properties={serialize(data)} />;
  } catch {
    return null;
  }
}

function FeaturedPropertiesSkeleton() {
  return (
    <section className="gcs-section" style={{ background: "var(--off-white)" }}>
      <div className="gcs-container">
        <div className="section-header">
          <div style={{ width: "140px", height: "16px", background: "#e9ecef", borderRadius: "8px", margin: "0 auto 12px" }} />
          <div style={{ width: "260px", height: "36px", background: "#e9ecef", borderRadius: "8px", margin: "0 auto 16px" }} />
          <div style={{ width: "380px", height: "16px", background: "#e9ecef", borderRadius: "8px", margin: "0 auto" }} />
        </div>
        <div style={{ display: "flex", gap: "30px", overflow: "hidden", paddingBottom: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              flex: "0 0 calc(33.333% - 20px)", minWidth: "350px",
              background: "white", borderRadius: "16px", overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{ height: "280px", background: "#e9ecef" }} />
              <div style={{ padding: "25px" }}>
                <div style={{ width: "120px", height: "14px", background: "#e9ecef", borderRadius: "6px", marginBottom: "12px" }} />
                <div style={{ width: "200px", height: "22px", background: "#e9ecef", borderRadius: "6px", marginBottom: "16px" }} />
                <div style={{ width: "100%", height: "1px", background: "#e9ecef", marginBottom: "16px" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ width: "80px", height: "24px", background: "#e9ecef", borderRadius: "6px" }} />
                  <div style={{ width: "40px", height: "16px", background: "#e9ecef", borderRadius: "6px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Suspense fallback={<FeaturedPropertiesSkeleton />}>
        <FeaturedPropertiesSection />
      </Suspense>
      <GalleryStrip />
      <VirtualTourSection />
      <WhyChooseUs />
      <WhoWeServe />
      <Testimonials />
      <NewsletterCTA />
    </>
  );
}
