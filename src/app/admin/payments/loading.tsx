export default function Loading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-[#f0f0f0] rounded animate-pulse" />
        <div className="h-8 w-56 bg-[#f0f0f0] rounded animate-pulse" />
      </div>
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 bg-[#f0f0f0] rounded-xl animate-pulse" />
        ))}
      </div>
      {/* Card skeleton */}
      <div className="bg-white rounded-2xl border border-[#e9ecef] p-6 space-y-4">
        <div className="h-5 w-40 bg-[#f0f0f0] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-[#f0f0f0] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-10 w-36 bg-[#f0f0f0] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
