"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Zap, Lock, HeadphonesIcon } from "lucide-react";

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    label: "Verified Properties",
    desc: "Every listing is personally inspected",
    color: "text-emerald-400",
  },
  {
    icon: Zap,
    label: "Confirmed Utilities",
    desc: "Power, water & WiFi guaranteed",
    color: "text-amber-400",
  },
  {
    icon: Lock,
    label: "Secure Payments",
    desc: "256-bit encrypted via Bizify",
    color: "text-blue-400",
  },
  {
    icon: HeadphonesIcon,
    label: "24/7 Guest Support",
    desc: "Real people, always available",
    color: "text-[#c9a961]",
  },
];

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{
      background: "var(--black)",
      padding: "48px 0",
      borderTop: "1px solid rgba(201,169,97,0.2)",
      borderBottom: "1px solid rgba(201,169,97,0.2)",
    }}>
      <div className="gcs-container">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {TRUST_SIGNALS.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-3"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{s.label}</p>
                <p className="text-white/40 text-xs mt-0.5 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
