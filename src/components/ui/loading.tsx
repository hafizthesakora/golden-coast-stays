"use client";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="luxury-card overflow-hidden">
      <div className="shimmer h-64 w-full" />
      <div className="p-5 space-y-3">
        <div className="shimmer h-5 rounded-lg w-3/4" />
        <div className="shimmer h-4 rounded-lg w-1/2" />
        <div className="shimmer h-4 rounded-lg w-2/3" />
        <div className="flex justify-between mt-4">
          <div className="shimmer h-6 rounded-lg w-1/3" />
          <div className="shimmer h-10 rounded-full w-28" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-gradient mb-4">
          <Spinner className="text-white h-7 w-7" />
        </div>
        <p className="text-[#6c757d] text-sm">Loading...</p>
      </div>
    </div>
  );
}
