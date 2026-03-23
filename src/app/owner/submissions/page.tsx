export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  Building2, Clock, CheckCircle, XCircle, PlusCircle,
  Calendar, MapPin, Bed, ImageIcon,
} from "lucide-react";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const userId = (session as { user?: { id?: string } })?.user?.id ?? "";
  const { status } = await searchParams;

  const [submissions, directPropertyCount] = await Promise.all([
    prisma.propertySubmission.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where: { ownerId: userId } }),
  ]);

  const statusConfig: Record<string, { pill: string; icon: React.ReactNode; label: string }> = {
    pending: {
      pill: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      icon: <Clock className="h-3.5 w-3.5" />,
      label: "Pending Review",
    },
    approved: {
      pill: "bg-green-100 text-green-800 border border-green-200",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: "Approved",
    },
    rejected: {
      pill: "bg-red-100 text-red-800 border border-red-200",
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Needs Revision",
    },
    live: {
      pill: "bg-blue-100 text-blue-800 border border-blue-200",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: "Live",
    },
  };

  const tabs = [
    { label: "All",            value: "" },
    { label: "Pending",        value: "pending" },
    { label: "Approved",       value: "approved" },
    { label: "Needs Revision", value: "rejected" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}
    >
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">My Submissions</h1>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#c9a961]/10 text-[#c9a961] text-xs font-semibold">
            {submissions.length} total
          </span>
        </div>
        <Link
          href="/owner/submit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> Submit New
        </Link>
      </div>

      <div className="p-6 lg:p-8 space-y-6">

        {/* Tab filters */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/owner/submissions?status=${tab.value}` : "/owner/submissions"}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                (status ?? "") === tab.value
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "bg-white text-[#343a40] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Submissions grid */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f8f9fa] flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-7 w-7 text-[#c9a961]" />
            </div>
            <p className="font-semibold text-[#1a1a1a] mb-1">No submissions found</p>
            <p className="text-[#6c757d] text-sm mb-5">
              {status ? `No ${status} submissions.` : "You haven't submitted any properties through this form yet."}
            </p>
            {!status && directPropertyCount > 0 && (
              <div className="mb-5 mx-auto max-w-sm bg-blue-50 border border-blue-100 rounded-xl p-4 text-left">
                <p className="text-blue-800 text-xs font-semibold mb-1">
                  You have {directPropertyCount} active {directPropertyCount === 1 ? "property" : "properties"} on your account
                </p>
                <p className="text-blue-700 text-xs">
                  {directPropertyCount === 1 ? "This property was" : "These properties were"} set up directly by our team and
                  {directPropertyCount === 1 ? " doesn't" : " don't"} appear as submissions. View them in{" "}
                  <Link href="/owner/properties" className="underline font-medium">My Properties</Link>.
                </p>
              </div>
            )}
            <Link
              href="/owner/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Submit a Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {submissions.map((sub) => {
              const cfg = statusConfig[sub.status] ?? {
                pill: "bg-gray-100 text-gray-700 border border-gray-200",
                icon: <Clock className="h-3.5 w-3.5" />,
                label: sub.status,
              };
              const images = (sub.images ?? []) as string[];
              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden hover:shadow-md transition-shadow">
                  {/* Status accent bar */}
                  <div
                    className={`h-2 ${
                      sub.status === "approved"
                        ? "bg-green-400"
                        : sub.status === "rejected"
                        ? "bg-red-400"
                        : "bg-[#c9a961]"
                    }`}
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg leading-tight">
                          {sub.propertyType
                            ? sub.propertyType.charAt(0).toUpperCase() + sub.propertyType.slice(1)
                            : "Property"}
                        </p>
                        <p className="text-[#c9a961] text-xs font-semibold mt-0.5">{sub.submissionRef}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.pill}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {sub.location && (
                        <div className="flex items-center gap-2 text-sm text-[#343a40]">
                          <MapPin className="h-3.5 w-3.5 text-[#6c757d] flex-shrink-0" />
                          {sub.location}
                        </div>
                      )}
                      {sub.bedrooms && (
                        <div className="flex items-center gap-2 text-sm text-[#343a40]">
                          <Bed className="h-3.5 w-3.5 text-[#6c757d] flex-shrink-0" />
                          {sub.bedrooms} bedroom{sub.bedrooms > 1 ? "s" : ""}
                          {sub.bathrooms ? ` · ${sub.bathrooms} bath` : ""}
                          {sub.maxGuests ? ` · ${sub.maxGuests} guests max` : ""}
                        </div>
                      )}
                      {sub.priceEstimate && (
                        <div className="flex items-center gap-2 text-sm text-[#343a40]">
                          <span className="text-[#6c757d] text-xs">Est.</span>
                          GHS {Number(sub.priceEstimate).toLocaleString()} / night
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#6c757d]">
                        <Calendar className="h-3.5 w-3.5" />
                        Submitted{" "}
                        {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    {sub.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {sub.amenities.slice(0, 4).map((a) => (
                          <span
                            key={a}
                            className="text-xs px-2 py-0.5 bg-[#f8f9fa] border border-[#e9ecef] rounded-full text-[#343a40]"
                          >
                            {a}
                          </span>
                        ))}
                        {sub.amenities.length > 4 && (
                          <span className="text-xs px-2 py-0.5 bg-[#f8f9fa] border border-[#e9ecef] rounded-full text-[#6c757d]">
                            +{sub.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Admin note */}
                    {sub.adminNote && (
                      <div className="p-3 bg-[#f8f9fa] rounded-xl border-l-2 border-[#c9a961] text-sm text-[#343a40] mt-3">
                        <p className="text-xs font-semibold text-[#6c757d] mb-1">Note from our team:</p>
                        {sub.adminNote}
                      </div>
                    )}

                    {/* Image gallery strip */}
                    {images.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-[#6c757d] mb-1.5 flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> {images.length} photo{images.length !== 1 ? "s" : ""} attached
                        </p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {images.slice(0, 5).map((src, i) => (
                            <div
                              key={i}
                              className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[#e9ecef]"
                            >
                              <Image
                                src={src}
                                alt={`Photo ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                          {images.length > 5 && (
                            <div className="w-16 h-12 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-xs text-[#6c757d] flex-shrink-0">
                              +{images.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejected CTA */}
                    {sub.status === "rejected" && (
                      <Link
                        href="/owner/submit"
                        className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[#c9a961]/10 text-[#c9a961] text-sm font-semibold hover:bg-[#c9a961]/20 transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" /> Resubmit with Changes
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
