"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2, Clock, CheckCircle, XCircle, MapPin, Bed, Calendar,
  ChevronDown, ChevronUp, Search, RotateCcw, FileText, TrendingUp,
  ImageIcon, X,
} from "lucide-react";

type Submission = {
  id: string;
  submissionRef: string;
  fullName: string;
  email: string;
  phone: string;
  propertyType: string | null;
  location: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  priceEstimate: string | null;
  description: string | null;
  message: string | null;
  amenities: string[];
  images: string[];
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string } | null;
};

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const PER_PAGE = 10;

function Pagination({
  total,
  page,
  perPage,
  onChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const range = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
      <p className="text-xs text-[#6c757d]">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="h-8 w-8 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          ‹
        </button>
        {range.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-8 w-8 rounded-lg text-sm font-medium ${p === page ? "bg-[#c9a961] text-white" : "border border-[#e9ecef] text-[#6c757d] hover:bg-[#f8f9fa]"}`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="h-8 w-8 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function SubmissionImageGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(src)}
            className="relative aspect-square rounded-xl overflow-hidden border border-[#e9ecef] hover:border-[#c9a961] transition-colors group"
          >
            <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-200" />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Property photo"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default function SubmissionsAdminClient({
  submissions,
  countMap,
  currentStatus,
  totalCount = 0,
  thisMonthCount = 0,
}: {
  submissions: Submission[];
  countMap: Record<string, number>;
  currentStatus?: string;
  totalCount?: number;
  thisMonthCount?: number;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localSubs, setLocalSubs] = useState(submissions);

  // Filter states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  const isFiltered =
    search !== "" ||
    typeFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
  };

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, dateFrom, dateTo, sortBy]);

  const handlePageChange = (p: number) => {
    setPage(p);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = useMemo(() => {
    let list = localSubs.filter(sub => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        sub.fullName.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        (sub.location || "").toLowerCase().includes(q) ||
        (sub.user?.name || "").toLowerCase().includes(q);

      const matchType =
        typeFilter === "all" ||
        (sub.propertyType || "").toLowerCase() === typeFilter.toLowerCase();

      const createdDate = new Date(sub.createdAt).getTime();
      const matchFrom = !dateFrom || createdDate >= new Date(dateFrom).getTime();
      const matchTo = !dateTo || createdDate <= new Date(dateTo).getTime();

      return matchSearch && matchType && matchFrom && matchTo;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest") return Number(b.priceEstimate || 0) - Number(a.priceEstimate || 0);
      if (sortBy === "lowest") return Number(a.priceEstimate || 0) - Number(b.priceEstimate || 0);
      return 0;
    });

    return list;
  }, [localSubs, search, typeFilter, dateFrom, dateTo, sortBy]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  );

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: notes[id] || undefined }),
      });
      if (res.ok) {
        setLocalSubs(prev =>
          prev.map(s => s.id === id ? { ...s, status, adminNote: notes[id] || s.adminNote } : s)
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  const tabs = [
    { label: "All", value: "", count: Object.values(countMap).reduce((a, b) => a + b, 0) },
    { label: "Pending", value: "pending", count: countMap["pending"] ?? 0 },
    { label: "Approved", value: "approved", count: countMap["approved"] ?? 0 },
    { label: "Rejected", value: "rejected", count: countMap["rejected"] ?? 0 },
  ];

  const statusPill: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    live:     "bg-blue-100 text-blue-800",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Property Submissions</h1>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: totalCount, icon: FileText, bg: "bg-[#c9a961]/10", color: "text-[#9a7b3c]" },
          { label: "Pending Review", value: countMap["pending"] ?? 0, icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
          { label: "Approved", value: countMap["approved"] ?? 0, icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
          { label: "This Month", value: thisMonthCount, icon: TrendingUp, bg: "bg-blue-50", color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e9ecef] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl leading-none">{s.value}</p>
              <p className="text-[#6c757d] text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/submissions?status=${tab.value}` : "/admin/submissions"}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              currentStatus === tab.value || (!currentStatus && !tab.value)
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#343a40] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-xs font-bold">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Filters row 1 */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, location…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
          />
        </div>

        {/* Property type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="all">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="house">House</option>
          <option value="studio">Studio</option>
          <option value="penthouse">Penthouse</option>
          <option value="townhouse">Townhouse</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Estimate</option>
          <option value="lowest">Lowest Estimate</option>
        </select>
      </div>

      {/* Filters row 2 */}
      <div className="flex flex-wrap gap-3">
        {/* Date from */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            Submitted From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
          />
        </div>

        {/* Date to */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            Submitted To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
          />
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="h-10 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] bg-white flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}

        <p className="h-10 flex items-center text-xs text-[#6c757d] ml-auto">
          Showing {filtered.length} of {localSubs.length} submission{localSubs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
        {localSubs.length === 0 ? (
          <div className="p-16 text-center text-[#6c757d]">No submissions found.</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-[#6c757d]">No submissions match your filters.</div>
        ) : (
          <>
            <div className="divide-y divide-[#f0f0f0]">
              {paginated.map(sub => {
                const isOpen = expanded === sub.id;
                return (
                  <div key={sub.id}>
                    {/* Row */}
                    <div
                      className="flex items-center gap-4 p-4 hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      onClick={() => setExpanded(isOpen ? null : sub.id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#c9a961]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-[#c9a961]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#1a1a1a] text-sm">
                            {sub.propertyType ? sub.propertyType.charAt(0).toUpperCase() + sub.propertyType.slice(1) : "Property"}
                            {sub.location ? ` — ${sub.location}` : ""}
                          </p>
                          <span className="text-[#c9a961] text-xs font-mono">{sub.submissionRef}</span>
                        </div>
                        <p className="text-[#6c757d] text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {!sub.user && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-semibold uppercase tracking-wide">
                              Guest
                            </span>
                          )}
                          {sub.user?.name || sub.fullName} ({sub.email}) ·{" "}
                          {new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusPill[sub.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {sub.status}
                      </span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-[#6c757d] flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#6c757d] flex-shrink-0" />}
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-[#f0f0f0] bg-[#fafafa] p-5 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-1">Contact</p>
                            <p className="font-medium text-[#1a1a1a]">{sub.fullName}</p>
                            <p className="text-[#343a40]">{sub.email}</p>
                            <p className="text-[#343a40]">{sub.phone}</p>
                          </div>
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-1">Property</p>
                            {sub.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#6c757d]" />{sub.location}</div>}
                            {sub.bedrooms && <div className="flex items-center gap-1"><Bed className="h-3 w-3 text-[#6c757d]" />{sub.bedrooms}bd / {sub.bathrooms ?? "?"}ba</div>}
                            {sub.maxGuests && <p>Max {sub.maxGuests} guests</p>}
                          </div>
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-1">Pricing</p>
                            <p>{sub.priceEstimate ? `GHS ${Number(sub.priceEstimate).toLocaleString()}/night` : "Not specified"}</p>
                            <div className="flex items-center gap-1 mt-1"><Calendar className="h-3 w-3 text-[#6c757d]" />{new Date(sub.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-1">Amenities</p>
                            <div className="flex flex-wrap gap-1">
                              {sub.amenities?.slice(0, 5).map(a => (
                                <span key={a} className="text-xs px-1.5 py-0.5 bg-white border border-[#e9ecef] rounded text-[#343a40]">{a}</span>
                              ))}
                              {(sub.amenities?.length ?? 0) > 5 && <span className="text-xs text-[#6c757d]">+{sub.amenities.length - 5}</span>}
                            </div>
                          </div>
                        </div>

                        {sub.description && (
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-1">Description</p>
                            <p className="text-sm text-[#343a40] leading-relaxed">{sub.description}</p>
                          </div>
                        )}
                        {sub.message && (
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-1">Additional Notes</p>
                            <p className="text-sm text-[#343a40]">{sub.message}</p>
                          </div>
                        )}

                        {/* Property photos */}
                        {sub.images && sub.images.length > 0 && (
                          <div>
                            <p className="text-[#6c757d] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Property Photos ({sub.images.length})
                            </p>
                            <SubmissionImageGallery images={sub.images} />
                          </div>
                        )}

                        {/* Admin note + actions */}
                        <div className="border-t border-[#e9ecef] pt-4 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[#343a40] mb-1.5">Note to Owner (optional)</label>
                            <textarea
                              rows={2}
                              value={notes[sub.id] ?? sub.adminNote ?? ""}
                              onChange={e => setNotes(n => ({ ...n, [sub.id]: e.target.value }))}
                              placeholder="Feedback for the owner..."
                              className="w-full px-3 py-2 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] resize-none"
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => updateStatus(sub.id, "approved")}
                              disabled={updating === sub.id || sub.status === "approved"}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {updating === sub.id ? "Saving..." : "Approve"}
                            </button>
                            <button
                              onClick={() => updateStatus(sub.id, "rejected")}
                              disabled={updating === sub.id || sub.status === "rejected"}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              {updating === sub.id ? "Saving..." : "Request Revision"}
                            </button>
                            <button
                              onClick={() => updateStatus(sub.id, "pending")}
                              disabled={updating === sub.id || sub.status === "pending"}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] text-[#343a40] text-sm font-medium hover:border-[#c9a961] transition-colors disabled:opacity-50"
                            >
                              <Clock className="h-4 w-4" />
                              Reset to Pending
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
}
