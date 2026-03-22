"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pannellum: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _staysHeaderViewer: any;
  }
}

export default function PanoramaHeader() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !viewerRef.current || !window.pannellum) return;
    if (window._staysHeaderViewer) {
      try { window._staysHeaderViewer.destroy(); } catch { /* ignore */ }
    }
    window._staysHeaderViewer = window.pannellum.viewer(viewerRef.current, {
      type: "equirectangular",
      panorama: "/images/im1.jpeg",
      autoLoad: true,
      autoRotate: -1.5,
      compass: false,
      showZoomCtrl: false,
      showFullscreenCtrl: false,
      showControls: false,
      hfov: 110,
      pitch: 0,
    });
  }, [ready]);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
        onLoad={() => setReady(true)}
        strategy="afterInteractive"
      />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />

      {/* Panorama container */}
      <div style={{ position: "relative", height: "480px", overflow: "hidden" }}>
        <div ref={viewerRef} style={{ width: "100%", height: "100%", background: "#0a0a0a" }}>
          {!ready && (
            <div style={{
              width: "100%", height: "100%", background: "#0a0a0a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                border: "3px solid rgba(201,169,97,0.3)",
                borderTopColor: "var(--gold-primary)",
                animation: "spin 0.8s linear infinite",
              }} />
            </div>
          )}
        </div>

        {/* Overlay content */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)",
          zIndex: 10,
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "0 0 50px", zIndex: 11,
          pointerEvents: "none",
        }}>
          <div className="gcs-container">
            <p className="section-subtitle" style={{ marginBottom: "10px", pointerEvents: "none" }}>Browse Properties</p>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 700, color: "white", marginBottom: "10px" }}>
              Explore Our Stays
            </h1>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", marginBottom: "14px", maxWidth: "480px" }}>
              Handpicked premium properties across Accra&apos;s finest neighbourhoods.
            </p>
            <nav style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "rgba(255,255,255,0.55)", pointerEvents: "auto" }}>
              <Link href="/" style={{ color: "var(--gold-primary)" }}>Home</Link>
              <span>/</span>
              <span style={{ color: "rgba(255,255,255,0.8)" }}>All Stays</span>
            </nav>
          </div>
        </div>

        {/* 360 badge */}
        <div style={{
          position: "absolute", top: "20px", right: "20px", zIndex: 12,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(201,169,97,0.4)",
          padding: "6px 14px", borderRadius: "20px",
          display: "flex", alignItems: "center", gap: "6px",
          color: "white", fontSize: "12px", fontWeight: 600,
          pointerEvents: "none",
        }}>
          <span style={{ color: "var(--gold-primary)", display: "inline-block", animation: "spin360 2s linear infinite" }}>↻</span> 360° View
        </div>

        {/* Drag indicator — center of viewer */}
        {ready && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 12, pointerEvents: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
            animation: "fadeOutHint 1s ease 3s forwards",
          }}>
            <div style={{
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(201,169,97,0.5)",
              borderRadius: "40px", padding: "10px 22px",
              display: "flex", alignItems: "center", gap: "10px",
              color: "white", fontSize: "13px", fontWeight: 600,
            }}>
              <span style={{ fontSize: "20px", animation: "dragHand 1.2s ease-in-out infinite" }}>👆</span>
              Drag to explore 360°
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin360 { to { transform: rotate(360deg); } }
        @keyframes fadeOutHint {
          0% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes dragHand {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
      `}</style>
    </>
  );
}
