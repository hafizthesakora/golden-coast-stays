export default function Loading() {
  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "white" }}>
      {/* Hero image skeleton */}
      <div style={{ height: "500px", background: "#e9ecef", position: "relative" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #e9ecef 25%, #f0f0f0 50%, #e9ecef 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      </div>
      <div className="gcs-container" style={{ padding: "50px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "50px" }}>
          <div>
            <div style={{ width: "60%", height: "36px", background: "#e9ecef", borderRadius: "8px", marginBottom: "16px" }} />
            <div style={{ width: "180px", height: "16px", background: "#e9ecef", borderRadius: "6px", marginBottom: "30px" }} />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: "100%", height: "14px", background: "#e9ecef", borderRadius: "6px", marginBottom: "10px" }} />
            ))}
          </div>
          <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", padding: "30px", height: "fit-content" }}>
            <div style={{ width: "140px", height: "32px", background: "#e9ecef", borderRadius: "6px", marginBottom: "20px" }} />
            <div style={{ width: "100%", height: "48px", background: "#e9ecef", borderRadius: "10px", marginBottom: "12px" }} />
            <div style={{ width: "100%", height: "48px", background: "#e9ecef", borderRadius: "10px", marginBottom: "20px" }} />
            <div style={{ width: "100%", height: "52px", background: "#e9ecef", borderRadius: "10px" }} />
          </div>
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
