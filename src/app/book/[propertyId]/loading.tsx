export default function Loading() {
  return (
    <div className="min-h-screen pt-20 bg-[#f8f9fa]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left side */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="h-6 w-48 bg-[#e9ecef] rounded animate-pulse" />
              <div className="flex gap-4">
                <div className="w-28 h-20 rounded-xl bg-[#f0f0f0] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-[#e9ecef] rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-[#f0f0f0] rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="h-6 w-40 bg-[#e9ecef] rounded animate-pulse" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-11 bg-[#f8f9fa] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          {/* Right side - price summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <div className="h-8 w-32 bg-[#e9ecef] rounded animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 bg-[#f8f9fa] rounded animate-pulse" />
            ))}
            <div className="h-12 bg-[#e9ecef] rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
