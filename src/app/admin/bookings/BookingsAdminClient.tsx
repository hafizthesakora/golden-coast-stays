"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  DollarSign,
  ListOrdered,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Booking {
  id: string;
  reference: string;
  guestName: string | null;
  guestEmail: string;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights?: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  property: { title: string; slug: string; images: { imageUrl: string }[]; owner: { name: string | null; email: string } | null };
  user: { name: string | null; email: string } | null;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const PER_PAGE = 10;

function computeNights(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86400000));
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

export default function BookingsAdminClient({
  bookings: initial,
  currentStatus,
}: {
  bookings: Booking[];
  currentStatus: string;
}) {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);
  const [bookings, setBookings] = useState(initial);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [minGuests, setMinGuests] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const isFiltered =
    search !== "" ||
    paymentFilter !== "all" ||
    checkInFrom !== "" ||
    checkInTo !== "" ||
    sortBy !== "newest" ||
    minGuests !== "" ||
    minAmount !== "" ||
    maxAmount !== "";

  const resetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setCheckInFrom("");
    setCheckInTo("");
    setSortBy("newest");
    setMinGuests("");
    setMinAmount("");
    setMaxAmount("");
  };

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [search, paymentFilter, checkInFrom, checkInTo, sortBy, minGuests, minAmount, maxAmount]);

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    scrollToTable();
  };

  // Computed stats
  const revenue = useMemo(
    () => bookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + Number(b.totalAmount), 0),
    [bookings]
  );
  const pendingCount = useMemo(() => bookings.filter(b => b.status === "pending").length, [bookings]);
  const confirmedCount = useMemo(() => bookings.filter(b => b.status === "confirmed").length, [bookings]);

  const statCards = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: ListOrdered,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Revenue",
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: "text-[#c9a961]",
      bg: "bg-[#c9a961]/10",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: AlertCircle,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
    },
  ];

  const filtered = useMemo(() => {
    let list = bookings.filter(b => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        b.reference.toLowerCase().includes(q) ||
        (b.guestName || "").toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        b.property.title.toLowerCase().includes(q);

      const matchPayment =
        paymentFilter === "all" ? true : b.paymentStatus === paymentFilter;

      const checkInDate = new Date(b.checkIn).getTime();
      const matchFrom = !checkInFrom || checkInDate >= new Date(checkInFrom).getTime();
      const matchTo = !checkInTo || checkInDate <= new Date(checkInTo).getTime();

      const matchGuests = !minGuests || b.guests >= Number(minGuests);
      const matchMinAmount = !minAmount || Number(b.totalAmount) >= Number(minAmount);
      const matchMaxAmount = !maxAmount || Number(b.totalAmount) <= Number(maxAmount);

      return matchSearch && matchPayment && matchFrom && matchTo && matchGuests && matchMinAmount && matchMaxAmount;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest") return Number(b.totalAmount) - Number(a.totalAmount);
      if (sortBy === "lowest") return Number(a.totalAmount) - Number(b.totalAmount);
      return 0;
    });

    return list;
  }, [bookings, search, paymentFilter, checkInFrom, checkInTo, sortBy, minGuests, minAmount, maxAmount]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  );

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.booking) {
        setBookings(bs => bs.map(b => b.id === id ? { ...b, status: data.booking.status } : b));
      }
    } finally {
      setUpdating(null);
    }
  };

  const statusVariant = (s: string) => {
    const map: Record<string, "warning" | "success" | "danger" | "info"> = {
      pending: "warning",
      confirmed: "success",
      cancelled: "danger",
      completed: "info",
    };
    return map[s] || "info";
  };

  const paymentVariant = (s: string) =>
    s === "paid" ? "success" : s === "failed" ? "danger" : "warning";

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Manage</p>
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Bookings</h1>
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

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() =>
              router.push(`/admin/bookings${t.value !== "all" ? `?status=${t.value}` : ""}`)
            }
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentStatus === t.value
                ? "bg-[#c9a961] text-white"
                : "bg-white border border-[#e9ecef] text-[#6c757d] hover:border-[#c9a961]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ref, guest, property…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
          />
        </div>

        {/* Payment status */}
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="all">All Payment</option>
          <option value="paid">Paid</option>
          <option value="pending">Awaiting Payment</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        {/* Check-in from */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            Check-in From
          </label>
          <input
            type="date"
            value={checkInFrom}
            onChange={e => setCheckInFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
          />
        </div>

        {/* Check-in to */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            Check-in To
          </label>
          <input
            type="date"
            value={checkInTo}
            onChange={e => setCheckInTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>
      </div>

      {/* Second filter row: guests + amount range + reset */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Min Guests */}
        <input
          type="number"
          min="1"
          value={minGuests}
          onChange={e => setMinGuests(e.target.value)}
          placeholder="Min Guests"
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] w-32"
        />

        {/* Min Amount */}
        <input
          type="number"
          min="0"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          placeholder="Min Amount"
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] w-32"
        />

        {/* Max Amount */}
        <input
          type="number"
          min="0"
          value={maxAmount}
          onChange={e => setMaxAmount(e.target.value)}
          placeholder="Max Amount"
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] w-32"
        />

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
          Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#f8f9fa]">
                {[
                  "Reference",
                  "Guest",
                  "Property",
                  "Check-in → Check-out",
                  "Nights",
                  "Amount",
                  "Status",
                  "Payment",
                  "Actions",
                ].map(h => (
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
              {paginated.map(b => {
                const nights = b.nights ?? computeNights(b.checkIn, b.checkOut);
                return (
                  <tr key={b.id} className="hover:bg-[#f8f9fa] transition-colors">
                    {/* Reference */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-[#c9a961]">{b.reference}</p>
                      <p className="text-xs text-[#6c757d]">
                        {new Date(b.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>

                    {/* Guest */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1a1a1a]">{b.guestName || b.user?.name || "—"}</p>
                      <p className="text-xs text-[#6c757d] truncate max-w-[140px]">{b.guestEmail || b.user?.email || "—"}</p>
                    </td>

                    {/* Property */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={b.property.images[0]?.imageUrl || "/images/h1.jpg"}
                            alt={b.property.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[#1a1a1a] truncate max-w-[120px]">{b.property.title}</p>
                          {b.property.owner && (
                            <p className="text-[10px] text-[#c9a961] truncate max-w-[120px]">
                              Owner: {b.property.owner.name ?? b.property.owner.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-[#6c757d]">
                        <Calendar className="h-3 w-3 text-[#c9a961]" />
                        {new Date(b.checkIn).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" → "}
                        {new Date(b.checkOut).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <p className="text-xs text-[#6c757d] mt-0.5">
                        {b.guests} guest{b.guests > 1 ? "s" : ""}
                      </p>
                    </td>

                    {/* Nights */}
                    <td className="px-4 py-3 text-sm text-[#6c757d] whitespace-nowrap">
                      {nights}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-semibold text-sm text-[#1a1a1a] whitespace-nowrap">
                      {formatCurrency(Number(b.totalAmount))}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-3">
                      <Badge variant={paymentVariant(b.paymentStatus)}>{b.paymentStatus}</Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/stays/${b.property.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#6c757d] hover:text-[#1a1a1a]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {b.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(b.id, "confirmed")}
                              disabled={updating === b.id}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-[#6c757d] hover:text-green-600"
                              title="Confirm"
                            >
                              {updating === b.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, "cancelled")}
                              disabled={updating === b.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#6c757d] hover:text-red-500"
                              title="Cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => updateStatus(b.id, "completed")}
                            disabled={updating === b.id}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-[#6c757d] hover:text-blue-600"
                            title="Mark Completed"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#6c757d] text-sm">
                    No bookings found
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
