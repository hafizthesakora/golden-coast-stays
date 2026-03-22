export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: "3px solid #f0e8d4",
          borderTopColor: "#c9a961",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontFamily: "var(--font-body)", color: "#9a7b3c", fontSize: "14px", letterSpacing: "1px" }}>
          Loading…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
