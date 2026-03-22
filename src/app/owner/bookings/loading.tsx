export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5">
        <div className="h-3 w-20 bg-[#e9ecef] rounded animate-pulse mb-2" />
        <div className="h-7 w-36 bg-[#e9ecef] rounded animate-pulse" />
      </div>
      <div className="p-6 lg:p-8 space-y-4">
        {/* Filter bar */}
        <div className="flex gap-3">
          <div className="h-11 w-48 bg-white rounded-xl border border-white/80 animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 w-24 bg-white rounded-xl border border-white/80 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm">
          <div className="h-12 bg-[#f8f9fa] border-b border-[#e9ecef]" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 border-b border-[#f8f9fa] px-6 flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[#f0f0f0] animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-[#e9ecef] rounded animate-pulse" />
                <div className="h-3 w-24 bg-[#f0f0f0] rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-[#f0f0f0] rounded-full animate-pulse" />
              <div className="h-3 w-16 bg-[#f0f0f0] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
