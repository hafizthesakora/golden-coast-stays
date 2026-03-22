"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthlyPoint {
  month: string; // "Jan", "Feb", …
  revenue: number;
  bookings: number;
}

interface StatusBreakdown {
  label: string;
  count: number;
  color: string;
}

interface TopProperty {
  title: string;
  bookings: number;
  revenue: number;
}

interface Props {
  monthly: MonthlyPoint[];
  statusBreakdown: StatusBreakdown[];
  topProperties: TopProperty[];
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ monthly }: { monthly: MonthlyPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  if (!monthly.length) return <div className="flex items-center justify-center h-48 text-[#6c757d] text-sm">No data yet</div>;

  const maxRev = Math.max(...monthly.map(m => m.revenue), 1);
  const maxBook = Math.max(...monthly.map(m => m.bookings), 1);
  const W = 560;
  const H = 180;
  const padL = 48;
  const padB = 28;
  const chartW = W - padL - 16;
  const chartH = H - padB - 8;
  const barW = Math.max(14, chartW / monthly.length / 2.4);
  const gap = chartW / monthly.length;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: 8 + chartH * (1 - f),
    label: f === 0 ? "0" : formatK(maxRev * f),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {yTicks.map(t => (
        <g key={t.y}>
          <line x1={padL} y1={t.y} x2={W - 16} y2={t.y} stroke="#f0f0f0" strokeWidth={1} />
          <text x={padL - 6} y={t.y + 4} textAnchor="end" fill="#adb5bd" fontSize={10}>{t.label}</text>
        </g>
      ))}

      {/* Bars */}
      {monthly.map((m, i) => {
        const cx = padL + i * gap + gap / 2;
        const revH = (m.revenue / maxRev) * chartH;
        const bookH = (m.bookings / maxBook) * chartH * 0.6;
        return (
          <g key={m.month}>
            {/* Revenue bar (gold) */}
            <rect
              x={cx - barW - 2}
              y={mounted ? 8 + chartH - revH : 8 + chartH}
              width={barW}
              height={mounted ? revH : 0}
              rx={4}
              fill="url(#goldGrad)"
              style={{ transition: `height 0.7s cubic-bezier(.4,0,.2,1) ${i * 60}ms, y 0.7s cubic-bezier(.4,0,.2,1) ${i * 60}ms` }}
            />
            {/* Bookings bar (dark) */}
            <rect
              x={cx + 2}
              y={mounted ? 8 + chartH - bookH : 8 + chartH}
              width={barW}
              height={mounted ? bookH : 0}
              rx={4}
              fill="#1a1a1a"
              opacity={0.15}
              style={{ transition: `height 0.7s cubic-bezier(.4,0,.2,1) ${i * 60 + 30}ms, y 0.7s cubic-bezier(.4,0,.2,1) ${i * 60 + 30}ms` }}
            />
            {/* Month label */}
            <text x={cx} y={H - 4} textAnchor="middle" fill="#6c757d" fontSize={10}>{m.month}</text>
          </g>
        );
      })}

      {/* Gradient def */}
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a961" />
          <stop offset="100%" stopColor="#9a7b3c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: StatusBreakdown[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 200); }, []);

  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <div className="flex items-center justify-center h-40 text-[#6c757d] text-sm">No bookings yet</div>;

  const R = 70;
  const r = 46;
  const cx = 90;
  const cy = 90;
  let cumAngle = -90;

  const slices = data.map(d => {
    const pct = d.count / total;
    const startAngle = cumAngle;
    cumAngle += pct * 360;
    return { ...d, pct, startAngle, endAngle: cumAngle };
  });

  function polarToXY(angle: number, radius: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startAngle: number, endAngle: number): string {
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const s = polarToXY(startAngle, R);
    const e = polarToXY(endAngle, R);
    const si = polarToXY(startAngle, r);
    const ei = polarToXY(endAngle, r);
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${r} ${r} 0 ${largeArc} 0 ${si.x} ${si.y} Z`;
  }

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-36 h-36 flex-shrink-0">
        {slices.map((s, i) => (
          <path
            key={s.label}
            d={mounted ? arcPath(s.startAngle, s.endAngle) : arcPath(-90, -90)}
            fill={s.color}
            style={{ transition: `d 0.6s ease ${i * 80}ms`, opacity: 0.9 }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#1a1a1a" fontSize={18} fontWeight={700}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6c757d" fontSize={9}>Total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {slices.map(s => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-sm text-[#343a40] capitalize">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1a1a1a]">{s.count}</span>
              <span className="text-xs text-[#adb5bd]">{Math.round(s.pct * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Properties Bar ───────────────────────────────────────────────────────
function TopPropertiesChart({ data }: { data: TopProperty[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 150); }, []);

  const maxBookings = Math.max(...data.map(d => d.bookings), 1);

  return (
    <div className="space-y-3">
      {data.map((p, i) => (
        <div key={p.title} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#343a40] font-medium truncate max-w-[60%]">{p.title}</span>
            <span className="text-[#6c757d] text-xs">{p.bookings} bookings</span>
          </div>
          <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c9a961] to-[#9a7b3c]"
              style={{
                width: mounted ? `${(p.bookings / maxBookings) * 100}%` : "0%",
                transition: `width 0.7s cubic-bezier(.4,0,.2,1) ${i * 80}ms`,
              }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-[#6c757d]">No property data yet</p>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${Math.round(n)}`;
}

// ─── Exported ─────────────────────────────────────────────────────────────────
export function RevenueBarChart({ monthly }: { monthly: MonthlyPoint[] }) {
  return <BarChart monthly={monthly} />;
}

export function BookingDonut({ data }: { data: StatusBreakdown[] }) {
  return <DonutChart data={data} />;
}

export function TopPropertiesBar({ data }: { data: TopProperty[] }) {
  return <TopPropertiesChart data={data} />;
}
