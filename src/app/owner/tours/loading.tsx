export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5">
        <div className="h-3 w-20 bg-[#e9ecef] rounded animate-pulse mb-2" />
        <div className="h-7 w-36 bg-[#e9ecef] rounded animate-pulse" />
      </div>
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm">
              <div className="h-44 bg-[#f0f0f0] animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-[#e9ecef] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#f0f0f0] rounded animate-pulse" />
                <div className="h-9 w-full bg-[#f0f0f0] rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
