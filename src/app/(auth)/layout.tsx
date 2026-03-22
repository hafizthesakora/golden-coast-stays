import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: {
    template: "%s | Golden Coast Stay",
    default: "Golden Coast Stay",
  },
  description: "Luxury short-term rentals in Accra, Ghana.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-200"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {children}
    </div>
  );
}
