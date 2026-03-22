"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, CheckCircle, XCircle, Trash2, Star, MessageSquare, BarChart2, Clock, Loader2, RotateCcw } from "lucide-react";
import { getInitials, truncate } from "@/lib/utils";

interface Review {
  id: string;
  propertyId: string;
  userId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  property: { title: string; slug: string };
  user: { name: string | null; email: string };
}

interface Counts {
  total: number;
  approved: number;
  pending: number;
  avgRating: string;
}

type FilterTab = "all" | "approved" | "pending";
type SortKey = "newest" | "oldest" | "highest" | "lowest";

const PER_PAGE = 10;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < rating ? "#c9a961" : "none"}
          stroke={i < rating ? "#c9a961" : "#d0d0d0"}
        />
      ))}
    </div>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <CheckCircle className="h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  );
}

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

export default function ReviewsAdminClient({
  reviews: initial,
  counts,
}: {
  reviews: Review[];
  counts: Counts;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState(initial);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isFiltered =
    search !== "" ||
    ratingFilter !== "any" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setSearch("");
    setRatingFilter("any");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
  };

  // Reset page on filter/tab change
  useEffect(() => {
    setPage(1);
  }, [tab, search, ratingFilter, dateFrom, dateTo, sortBy]);

  const handlePageChange = (p: number) => {
    setPage(p);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = useMemo(() => {
    let list = reviews.filter(r => {
      const matchTab =
        tab === "all" ? true : tab === "approved" ? r.isApproved : !r.isApproved;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (r.user.name || "").toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        r.property.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q);
      const matchRating = ratingFilter === "any" || r.rating === Number(ratingFilter);
      const createdDate = new Date(r.createdAt).getTime();
      const matchFrom = !dateFrom || createdDate >= new Date(dateFrom).getTime();
      const matchTo = !dateTo || createdDate <= new Date(dateTo).getTime();
      return matchTab && matchSearch && matchRating && matchFrom && matchTo;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });

    return list;
  }, [reviews, tab, search, ratingFilter, dateFrom, dateTo, sortBy]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  );

  const showToast = (msg: string) => setToast(msg);

  const toggleApprove = async (id: string, isApproved: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
      });
      const data = await res.json();
      if (data.review) {
        setReviews(rs => rs.map(r => r.id === id ? { ...r, isApproved: data.review.isApproved } : r));
        showToast(isApproved ? "Review approved" : "Review unapproved");
      }
    } finally {
      setUpdating(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(rs => rs.filter(r => r.id !== id));
        showToast("Review deleted");
      }
    } finally {
      setUpdating(null);
    }
  };

  const statCards = [
    {
      label: "Total Reviews",
      value: counts.total,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Pending Approval",
      value: counts.pending,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Average Rating",
      value: counts.avgRating,
      icon: BarChart2,
      color: "text-[#c9a961]",
      bg: "bg-[#c9a961]/10",
    },
  ];

  const TABS: { value: FilterTab; label: string }[] = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-8">
        <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Manage</p>
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Reviews</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e9ecef] p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl">{s.value}</p>
              <p className="text-[#6c757d] text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-[#c9a961] text-white"
                : "bg-white border border-[#e9ecef] text-[#6c757d] hover:border-[#c9a961]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters row 1 */}
      <div className="flex flex-wrap gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guest, property, comment…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
          />
        </div>

        {/* Rating filter */}
        <select
          value={ratingFilter}
          onChange={e => setRatingFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="any">Any Rating</option>
          <option value="5">5★</option>
          <option value="4">4★</option>
          <option value="3">3★</option>
          <option value="2">2★</option>
          <option value="1">1★</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Filters row 2 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Date from */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            From
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
            To
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
          Showing {filtered.length} of {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#f8f9fa]">
                {["Guest", "Property", "Rating", "Review", "Date", "Status", "Actions"].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-[#6c757d] uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map(r => (
                <tr key={r.id} className="hover:bg-[#f8f9fa] transition-colors">
                  {/* Guest */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(r.user.name || r.user.email)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1a1a1a] text-sm">{r.user.name || "—"}</p>
                        <p className="text-xs text-[#6c757d] truncate max-w-[140px]">{r.user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Property */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#1a1a1a] truncate max-w-[160px]">{r.property.title}</p>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <StarRating rating={r.rating} />
                  </td>

                  {/* Review */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-[#6c757d] max-w-[220px]">{truncate(r.comment, 90)}</p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs text-[#6c757d]">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    {r.isApproved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {updating === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#6c757d]" />
                      ) : (
                        <>
                          {!r.isApproved ? (
                            <button
                              onClick={() => toggleApprove(r.id, true)}
                              title="Approve"
                              className="p-1.5 rounded-lg hover:bg-green-50 text-[#6c757d] hover:text-green-600 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleApprove(r.id, false)}
                              title="Unapprove"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6c757d] hover:text-gray-600 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteReview(r.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#6c757d] hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#6c757d] text-sm">
                    No reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={handlePageChange} />
      </div>
    </div>
  );
}
