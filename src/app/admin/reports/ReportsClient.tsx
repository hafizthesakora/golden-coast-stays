"use client";

import { RevenueBarChart, BookingDonut } from "@/components/admin/DashboardCharts";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Download, TrendingUp, Users, Home, DollarSign } from "lucide-react";

interface MonthlyPoint { month: string; revenue: number; bookings: number }
interface StatusBreakdown { label: string; count: number; color: string }
interface TopProperty { title: string; city: string; bookings: number; revenue: number; occupancyRate: number }
interface OwnerRow { name: string; email: string; ownerId: string; properties: number; bookings: number; grossRevenue: number; netRevenue: number; refunded: number }
interface GuestRow { name: string; email: string; bookings: number; totalSpent: number; avgNights: number }

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

function ExportBtn({ rows, filename, label }: { rows: Record<string, unknown>[]; filename: string; label: string }) {
  return (
    <button
      onClick={() => downloadCSV(rows, filename)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e9ecef] text-xs font-medium text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
    >
      <Download className="h-3 w-3" /> {label}
    </button>
  );
}

export default function ReportsClient({
  monthly,
  statusBreakdown,
  topProperties,
  owners,
  guests,
  summary,
}: {
  monthly: MonthlyPoint[];
  statusBreakdown: StatusBreakdown[];
  topProperties: TopProperty[];
  owners: OwnerRow[];
  guests: GuestRow[];
  summary: {
    grossRevenue: number;
    refundedRevenue: number;
    netRevenue: number;
    totalBookings: number;
    conversionRate: number;
    avgBookingValue: number;
    avgNights: number;
    totalProperties: number;
    totalOwners: number;
    totalGuests: number;
  };
}) {
  const kpis = [
    { label: "Net Revenue",      value: formatCurrency(summary.netRevenue),        sub: `Gross ${formatCurrency(summary.grossRevenue)}`, icon: DollarSign, color: "#c9a961" },
    { label: "Total Bookings",   value: summary.totalBookings,                     sub: `${summary.conversionRate}% confirmed/completed`, icon: TrendingUp, color: "#3b82f6" },
    { label: "Avg Booking Value",value: formatCurrency(summary.avgBookingValue),   sub: `Avg ${summary.avgNights.toFixed(1)} nights`,     icon: Users,      color: "#10b981" },
    { label: "Properties",       value: summary.totalProperties,                   sub: `${summary.totalOwners} owners · ${summary.totalGuests} guests`, icon: Home, color: "#8b5cf6" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Admin Panel</p>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">System Reports</h1>
        </div>
        <ExportBtn
          rows={monthly.map(m => ({ Month: m.month, Revenue: m.revenue, Bookings: m.bookings }))}
          filename="gcs-monthly-report.csv"
          label="Export Monthly CSV"
        />
      </div>

      <div className="p-6 lg:p-8 space-y-8">

        {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${k.color}18` }}>
                  <k.icon className="h-4 w-4" style={{ color: k.color }} />
                </div>
              </div>
              <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-2xl leading-none mb-1">{k.value}</p>
              <p className="text-[#6c757d] text-xs">{k.label}</p>
              <p className="text-[#adb5bd] text-[10px] mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gross Revenue", value: formatCurrency(summary.grossRevenue), note: "All paid bookings", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Refunded",      value: formatCurrency(summary.refundedRevenue), note: "Cancelled after payment", color: "text-red-500", bg: "bg-red-50" },
            { label: "Net Revenue",   value: formatCurrency(summary.netRevenue), note: "Gross minus refunds", color: "text-[#c9a961]", bg: "bg-[#c9a961]/10" },
          ].map(r => (
            <div key={r.label} className={`rounded-2xl ${r.bg} border border-white/60 p-5 shadow-sm`}>
              <p className={`font-['Playfair_Display'] font-bold text-2xl ${r.color} mb-1`}>{r.value}</p>
              <p className="text-[#343a40] text-sm font-medium">{r.label}</p>
              <p className="text-[#6c757d] text-xs mt-0.5">{r.note}</p>
            </div>
          ))}
        </div>

        {/* ── Charts Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Revenue Trend</p>
                <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Last 12 Months</h2>
              </div>
              <ExportBtn
                rows={monthly.map(m => ({ Month: m.month, Revenue_GHS: m.revenue, Bookings: m.bookings }))}
                filename="gcs-monthly-revenue.csv"
                label="CSV"
              />
            </div>
            <RevenueBarChart monthly={monthly} />
          </div>

          <div className="bg-white rounded-2xl border border-white/80 p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Breakdown</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Booking Status</h2>
            </div>
            <BookingDonut data={statusBreakdown} />
            <div className="mt-4 space-y-1.5">
              {statusBreakdown.map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-[#6c757d]">{s.label}</span>
                  </div>
                  <span className="font-semibold text-[#1a1a1a]">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Top Properties ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
            <div>
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Performance</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Top Properties by Revenue</h2>
            </div>
            <ExportBtn
              rows={topProperties.map(p => ({ Property: p.title, City: p.city, Bookings: p.bookings, Revenue_GHS: p.revenue }))}
              filename="gcs-top-properties.csv"
              label="CSV"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider border-b border-[#f0f0f0]">
                  {["#", "Property", "City", "Bookings", "Revenue", "Occupancy"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8f9fa]">
                {topProperties.map((p, i) => (
                  <tr key={p.title} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3 text-[#adb5bd] font-medium text-xs">#{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#1a1a1a] text-sm">{p.title}</td>
                    <td className="px-5 py-3 text-[#6c757d] text-xs">{p.city}</td>
                    <td className="px-5 py-3 text-[#343a40]">{p.bookings}</td>
                    <td className="px-5 py-3 font-semibold text-[#1a1a1a]">{formatCurrency(p.revenue)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#f0f0f0] rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-[#c9a961] h-1.5 rounded-full" style={{ width: `${Math.min(p.occupancyRate, 100)}%` }} />
                        </div>
                        <span className="text-xs text-[#6c757d]">{p.occupancyRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {topProperties.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#adb5bd] text-sm">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Owner Performance ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
            <div>
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Revenue by Owner</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Owner Performance</h2>
            </div>
            <ExportBtn
              rows={owners.map(o => ({ Owner: o.name, Email: o.email, Properties: o.properties, Bookings: o.bookings, Gross_GHS: o.grossRevenue, Refunded_GHS: o.refunded, Net_GHS: o.netRevenue }))}
              filename="gcs-owner-performance.csv"
              label="CSV"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider border-b border-[#f0f0f0]">
                  {["Owner", "Properties", "Bookings", "Gross", "Refunded", "Net Revenue"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8f9fa]">
                {owners.map(o => (
                  <tr key={o.ownerId} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1a1a1a] text-sm">{o.name || "—"}</p>
                      <p className="text-xs text-[#adb5bd]">{o.email}</p>
                    </td>
                    <td className="px-5 py-3 text-[#343a40]">
                      <Link href={`/admin/properties?ownerId=${o.ownerId}`} className="text-[#c9a961] hover:underline font-medium">
                        {o.properties}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[#343a40]">{o.bookings}</td>
                    <td className="px-5 py-3 text-[#343a40]">{formatCurrency(o.grossRevenue)}</td>
                    <td className="px-5 py-3 text-red-500 text-xs">{o.refunded > 0 ? `-${formatCurrency(o.refunded)}` : "—"}</td>
                    <td className="px-5 py-3 font-semibold text-[#1a1a1a]">{formatCurrency(o.netRevenue)}</td>
                  </tr>
                ))}
                {owners.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#adb5bd] text-sm">No owners yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Top Guests ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
            <div>
              <p className="text-xs text-[#adb5bd] uppercase tracking-widest font-medium">Guest Insights</p>
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a]">Top Guests by Spend</h2>
            </div>
            <ExportBtn
              rows={guests.map(g => ({ Guest: g.name, Email: g.email, Bookings: g.bookings, Total_Spent_GHS: g.totalSpent, Avg_Nights: g.avgNights }))}
              filename="gcs-top-guests.csv"
              label="CSV"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider border-b border-[#f0f0f0]">
                  {["#", "Guest", "Bookings", "Total Spent", "Avg Nights"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8f9fa]">
                {guests.map((g, i) => (
                  <tr key={g.email} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3 text-[#adb5bd] font-medium text-xs">#{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#1a1a1a] text-sm">{g.name || "Guest"}</p>
                      <p className="text-xs text-[#adb5bd]">{g.email}</p>
                    </td>
                    <td className="px-5 py-3 text-[#343a40]">{g.bookings}</td>
                    <td className="px-5 py-3 font-semibold text-[#1a1a1a]">{formatCurrency(g.totalSpent)}</td>
                    <td className="px-5 py-3 text-[#6c757d] text-xs">{g.avgNights.toFixed(1)} nights avg</td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-[#adb5bd] text-sm">No paid bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
