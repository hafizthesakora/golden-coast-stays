export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { Globe, PlusCircle } from "lucide-react";
import Link from "next/link";
import OwnerToursClient from "@/components/owner/OwnerToursClient";

export default async function OwnerToursPage() {
  const session = await auth();
  const userId = (session as { user?: { id?: string } })?.user?.id ?? "";

  const properties = await prisma.property.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      city: true,
      propertyType: true,
      hasVirtualTour: true,
      virtualTourUrl: true,
      images: { take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  type TourProperty = typeof properties[number];
  const hasTourCount = properties.filter((p: TourProperty) => p.hasVirtualTour).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">Virtual Tours</h1>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#c9a961]/10 text-[#c9a961] text-xs font-semibold">
            {hasTourCount} active
          </span>
        </div>
        <Link
          href="/owner/submit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> Submit Property
        </Link>
      </div>

      <div className="p-6 lg:p-8">

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-[#c9a961]/8 border border-[#c9a961]/20 rounded-2xl mb-6">
          <Globe className="h-5 w-5 text-[#c9a961] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">Add 360° Virtual Tours</p>
            <p className="text-sm text-[#6c757d]">
              Paste a link to your virtual tour (Matterport, CloudPano, Kuula, etc.) for each property. Guests can preview tours before booking, which increases conversion rates significantly.
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-5">
              <Globe className="h-9 w-9 text-[#c9a961]" />
            </div>
            <p className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a] mb-2">No Properties Yet</p>
            <p className="text-[#6c757d] mb-6 max-w-sm mx-auto">
              Submit your first property to start adding virtual tours.
            </p>
            <Link
              href="/owner/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Submit a Property
            </Link>
          </div>
        ) : (
          <OwnerToursClient properties={serialize(properties)} />
        )}

      </div>
    </div>
  );
}
