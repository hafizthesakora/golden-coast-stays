export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="bg-white border-b border-[#e9ecef] px-8 py-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-[#f0f0f0] rounded animate-pulse" />
          <div className="h-7 w-48 bg-[#f0f0f0] rounded animate-pulse" />
        </div>
      </div>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e9ecef] p-5 space-y-3">
              <div className="w-10 h-10 bg-[#f0f0f0] rounded-xl animate-pulse" />
              <div className="h-7 w-16 bg-[#f0f0f0] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[#f0f0f0] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e9ecef] p-6 h-64 animate-pulse" />
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-6 h-64 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
