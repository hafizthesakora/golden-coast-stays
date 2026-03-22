export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5">
        <div className="h-3 w-20 bg-[#e9ecef] rounded animate-pulse mb-2" />
        <div className="h-7 w-40 bg-[#e9ecef] rounded animate-pulse" />
      </div>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] animate-pulse mb-4" />
              <div className="h-7 w-20 bg-[#e9ecef] rounded animate-pulse mb-2" />
              <div className="h-3 w-28 bg-[#f0f0f0] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
            <div className="h-5 w-32 bg-[#e9ecef] rounded animate-pulse mb-4" />
            <div className="h-48 bg-[#f8f9fa] rounded-xl animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
            <div className="h-5 w-28 bg-[#e9ecef] rounded animate-pulse mb-4" />
            <div className="h-48 bg-[#f8f9fa] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
