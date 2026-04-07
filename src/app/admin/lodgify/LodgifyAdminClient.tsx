"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Building2, CheckCircle, XCircle, AlertCircle,
  Loader2, ExternalLink, Calendar, Copy, Check, Info, Clock, Zap,
} from "lucide-react";

interface LastSyncResult {
  imported: number;
  updated: number;
  skipped: number;
  elapsed: string;
}

interface LodgifyStatus {
  apiKeyConfigured: boolean;
  syncedProperties: number;
  lodgifyBookings: number;
  totalBookings: number;
  webhookUrl: string | null;
  lastSync: string | null;
  lastSyncResult: LastSyncResult | null;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleString();
}

export default function LodgifyAdminClient() {
  const [status, setStatus] = useState<LodgifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingProps, setSyncingProps] = useState(false);
  const [syncingBookings, setSyncingBookings] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lodgify/status");
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function syncProperties() {
    setSyncingProps(true);
    try {
      const res = await fetch("/api/admin/lodgify/sync-properties", { method: "POST" });
      const data = await res.json();
      showToast(res.ok ? (data.message ?? "Sync complete") : (data.error ?? "Sync failed"), res.ok);
      if (res.ok) fetchStatus();
    } catch { showToast("Network error", false); }
    finally { setSyncingProps(false); }
  }

  async function syncBookings() {
    setSyncingBookings(true);
    try {
      const res = await fetch("/api/admin/lodgify/sync-bookings", { method: "POST" });
      const data = await res.json();
      showToast(res.ok ? (data.message ?? "Sync complete") : (data.error ?? "Sync failed"), res.ok);
      if (res.ok) fetchStatus();
    } catch { showToast("Network error", false); }
    finally { setSyncingBookings(false); }
  }

  async function runCronNow() {
    setRunningCron(true);
    try {
      const res = await fetch("/api/cron/lodgify-sync");
      const data = await res.json();
      if (res.ok) {
        showToast(`Done — ${data.imported} new, ${data.updated} updated, ${data.skipped} unchanged`, true);
        fetchStatus();
      } else {
        showToast(data.error ?? "Sync failed", false);
      }
    } catch { showToast("Network error", false); }
    finally { setRunningCron(false); }
  }

  async function copyWebhookUrl() {
    if (!status?.webhookUrl) return;
    await navigator.clipboard.writeText(status.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] p-4 md:p-8">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg max-w-sm ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[#1a1a1a]">Lodgify Integration</h1>
            <p className="text-sm text-[#6c757d] mt-1">
              Auto-syncs every 15 minutes · Properties and bookings from all channels
            </p>
          </div>
          {/* Manual trigger */}
          <button
            onClick={runCronNow}
            disabled={runningCron || !status?.apiKeyConfigured}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-xs font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {runningCron ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Sync Now
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#c9a961]" />
          </div>
        ) : (
          <>
            {/* Status cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatusCard label="API Key" ok={!!status?.apiKeyConfigured} value={status?.apiKeyConfigured ? "Connected" : "Missing"} />
              <InfoCard label="Lodgify Properties" value={status?.syncedProperties ?? 0} sub="mapped" />
              <InfoCard label="Lodgify Bookings" value={status?.lodgifyBookings ?? 0} sub="imported" />
              <InfoCard label="Total Bookings" value={status?.totalBookings ?? 0} sub="all sources" />
            </div>

            {/* Last sync status */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#c9a961]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-[#c9a961]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1a1a1a]">
                  {status?.lastSync ? `Last synced ${relativeTime(status.lastSync)}` : "Never synced via cron"}
                </p>
                {status?.lastSyncResult && (
                  <p className="text-xs text-[#6c757d] mt-0.5">
                    {status.lastSyncResult.imported} imported · {status.lastSyncResult.updated} updated · {status.lastSyncResult.skipped} unchanged · {status.lastSyncResult.elapsed}
                  </p>
                )}
                {!status?.lastSync && (
                  <p className="text-xs text-[#6c757d] mt-0.5">
                    Cron runs automatically every 15 minutes on Vercel. Click "Sync Now" to run immediately.
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${status?.lastSync ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status?.lastSync ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {status?.lastSync ? "Active" : "Pending"}
                </span>
              </div>
            </div>

            {/* API Key warning */}
            {!status?.apiKeyConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">LODGIFY_API_KEY not configured</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Add your API key to <code className="bg-amber-100 px-1 rounded">.env</code> and redeploy.
                    Find it in <strong>Lodgify → Settings → Public API</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* One-time actions */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e9ecef]">
                <h2 className="text-sm font-semibold text-[#1a1a1a]">One-time Import</h2>
                <p className="text-xs text-[#6c757d] mt-0.5">Use these once to pull existing data. The cron handles ongoing sync automatically.</p>
              </div>
              <div className="divide-y divide-[#e9ecef]">
                <ActionRow
                  icon={<Building2 className="h-5 w-5 text-[#c9a961]" />}
                  title="Import Properties from Lodgify"
                  description="Pulls all 9 Lodgify properties. New ones created as inactive drafts — set GHS price and publish to make them live."
                  buttonLabel="Import Properties"
                  loading={syncingProps}
                  disabled={!status?.apiKeyConfigured || syncingProps || syncingBookings}
                  onClick={syncProperties}
                />
                <ActionRow
                  icon={<Calendar className="h-5 w-5 text-[#c9a961]" />}
                  title="Import All Existing Bookings"
                  description="Imports past and current bookings from all Lodgify channels that aren't already in your platform."
                  buttonLabel="Import Bookings"
                  loading={syncingBookings}
                  disabled={!status?.apiKeyConfigured || syncingProps || syncingBookings}
                  onClick={syncBookings}
                />
              </div>
            </div>

            {/* Webhook info */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e9ecef]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1a1a1a]">Real-time Webhook</h2>
                    <p className="text-xs text-[#6c757d] mt-0.5">Optional — for instant sync instead of waiting up to 15 minutes.</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#f4f5f7] text-[#6c757d]">Optional</span>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Lodgify does not have a Webhooks section in Settings. The 15-minute cron handles this automatically.
                    If Lodgify ever adds webhook support, register the URL below.
                  </p>
                </div>

                {status?.webhookUrl && (
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a1a] mb-2">Webhook URL (for future use):</p>
                    <div className="flex items-center gap-2 bg-[#f4f5f7] rounded-xl px-4 py-3">
                      <code className="flex-1 text-xs text-[#495057] font-mono truncate">{status.webhookUrl}</code>
                      <button
                        onClick={copyWebhookUrl}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-[#c9a961] hover:text-[#9a7b3c] transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#1a1a1a]">How the sync works</h2>
              <ol className="space-y-3">
                <FlowStep
                  step="1"
                  title="Every 15 minutes — automatic"
                  desc="Vercel runs the cron job. It checks Lodgify for new or changed bookings and imports them. You don't need to do anything."
                />
                <FlowStep
                  step="2"
                  title="Lodgify → Your site"
                  desc="Bookings from Airbnb, Booking.com, or direct Lodgify appear in your Admin → Bookings automatically. Marked with a Lodgify badge."
                />
                <FlowStep
                  step="3"
                  title="Your site → Lodgify"
                  desc="When a guest books on your site and pays, the booking is instantly pushed to Lodgify — blocking those dates on all other channels."
                />
              </ol>
              <a
                href="https://app.lodgify.com/reservations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#c9a961] hover:text-[#9a7b3c] font-medium"
              >
                View Lodgify Reservations <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e9ecef] p-4">
      <div className="flex items-center gap-2 mb-2">
        {ok ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
        <span className="text-xs font-medium text-[#6c757d]">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${ok ? "text-emerald-600" : "text-red-500"}`}>{value}</p>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e9ecef] p-4">
      <p className="text-xs font-medium text-[#6c757d] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a]">{value}</p>
      <p className="text-[10px] text-[#adb5bd] mt-0.5">{sub}</p>
    </div>
  );
}

function ActionRow({
  icon, title, description, buttonLabel, loading, disabled, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="px-6 py-5 flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#c9a961]/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1a1a1a]">{title}</p>
        <p className="text-xs text-[#6c757d] mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#c9a961] text-white text-xs font-semibold rounded-xl hover:bg-[#9a7b3c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {buttonLabel}
      </button>
    </div>
  );
}

function FlowStep({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#c9a961] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
        {step}
      </span>
      <div>
        <p className="text-sm font-medium text-[#1a1a1a]">{title}</p>
        <p className="text-xs text-[#6c757d] mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}
