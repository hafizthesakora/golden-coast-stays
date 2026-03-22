export default function Loading() {
  return (
    <div style={{ paddingTop: "100px", minHeight: "100vh", background: "#f8f9fa" }}>
      <div className="gcs-container" style={{ padding: "60px 20px" }}>
        {/* Header skeleton */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ width: "200px", height: "40px", background: "#e9ecef", borderRadius: "8px", marginBottom: "16px" }} />
          <div style={{ width: "320px", height: "18px", background: "#e9ecef", borderRadius: "6px" }} />
        </div>
        {/* Grid skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ height: "240px", background: "#e9ecef" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #e9ecef 25%, #f5f5f5 50%, #e9ecef 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ width: "120px", height: "13px", background: "#e9ecef", borderRadius: "6px", marginBottom: "10px" }} />
                <div style={{ width: "80%", height: "20px", background: "#e9ecef", borderRadius: "6px", marginBottom: "14px" }} />
                <div style={{ width: "100%", height: "1px", background: "#e9ecef", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ width: "90px", height: "22px", background: "#e9ecef", borderRadius: "6px" }} />
                  <div style={{ width: "50px", height: "16px", background: "#e9ecef", borderRadius: "6px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
