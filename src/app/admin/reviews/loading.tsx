export default function Loading() {
  return (
    <div className="p-8 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-[#e9ecef]" />
      ))}
    </div>
  );
}
