export default function Loading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-[#f0f0f0] rounded animate-pulse" />
        <div className="h-8 w-40 bg-[#f0f0f0] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#e9ecef] h-48 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
