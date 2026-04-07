"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Info, Eye, EyeOff, CheckCircle } from "lucide-react";

interface PaymentConfigData {
  id: string;
  provider: string;
  apiKey: string | null;
  secretKey: string | null;
  webhookUrl: string | null;
  isLive: boolean;
  isActive: boolean;
  extra: string | null;
  updatedAt: string;
  createdAt: string;
}

interface Props {
  initialConfigs: Record<string, PaymentConfigData>;
}

type Provider = "bizify";

interface BizifyExtra {
  merchantId?: string;
  businessName?: string;
}


function parseExtra<T>(raw: string | null): T {
  if (!raw) return {} as T;
  try { return JSON.parse(raw) as T; } catch { return {} as T; }
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#343a40] font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          display: "inline-flex",
          height: "24px",
          width: "44px",
          flexShrink: 0,
          cursor: "pointer",
          borderRadius: "9999px",
          border: "2px solid transparent",
          transition: "background-color 0.2s",
          outline: "none",
          background: checked ? "#c9a961" : "#d1d5db",
        }}
      >
        <span
          style={{
            pointerEvents: "none",
            display: "inline-block",
            height: "20px",
            width: "20px",
            borderRadius: "9999px",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "transform 0.2s ease-in-out",
            transform: checked ? "translateX(20px)" : "translateX(0px)",
          }}
        />
      </button>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center border border-[#e9ecef] rounded-xl overflow-hidden focus-within:border-[#c9a961] bg-white">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-10 px-3 text-sm focus:outline-none bg-transparent text-[#1a1a1a] placeholder:text-[#adb5bd]"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="px-3 text-[#6c757d] hover:text-[#1a1a1a] transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const TABS: { key: Provider; label: string }[] = [
  { key: "bizify", label: "Bizify" },
];

const inputClass =
  "w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] placeholder:text-[#adb5bd]";

export default function PaymentsAdminClient({ initialConfigs }: Props) {
  const [activeTab, setActiveTab] = useState<Provider>("bizify");
  const [configs, setConfigs] = useState(initialConfigs);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Per-provider form state
  const [forms, setForms] = useState<
    Record<Provider, {
      apiKey: string;
      secretKey: string;
      webhookUrl: string;
      isLive: boolean;
      isActive: boolean;
      extra: Record<string, string>;
    }>
  >(() => {
    const init = {} as Record<Provider, {
      apiKey: string;
      secretKey: string;
      webhookUrl: string;
      isLive: boolean;
      isActive: boolean;
      extra: Record<string, string>;
    }>;
    for (const p of ["bizify"] as Provider[]) {
      const c = initialConfigs[p];
      init[p] = {
        apiKey: c?.apiKey ?? "",
        secretKey: c?.secretKey ?? "",
        webhookUrl: c?.webhookUrl ?? "",
        isLive: c?.isLive ?? false,
        isActive: c?.isActive ?? false,
        extra: parseExtra<Record<string, string>>(c?.extra ?? null),
      };
    }
    return init;
  });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function setField<K extends keyof typeof forms[Provider]>(
    provider: Provider,
    key: K,
    value: typeof forms[Provider][K]
  ) {
    setForms((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [key]: value },
    }));
  }

  function setExtra(provider: Provider, key: string, value: string) {
    setForms((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        extra: { ...prev[provider].extra, [key]: value },
      },
    }));
  }

  async function handleSave(provider: Provider) {
    setSaving(true);
    try {
      const form = forms[provider];
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: form.apiKey || null,
          secretKey: form.secretKey || null,
          webhookUrl: form.webhookUrl || null,
          isLive: form.isLive,
          isActive: form.isActive,
          extra: Object.keys(form.extra).length > 0 ? form.extra : null,
        }),
      });
      if (res.ok) {
        setToast({ msg: `${provider.charAt(0).toUpperCase() + provider.slice(1)} configuration saved.`, ok: true });
      } else {
        setToast({ msg: "Failed to save. Please try again.", ok: false });
      }
    } catch {
      setToast({ msg: "Network error.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  const form = forms[activeTab];

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg ${
            toast.ok ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.ok ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 sticky top-0 z-20 shadow-sm">
        <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">
          Configuration
        </p>
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">
          Payment Configuration
        </h1>
      </div>

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-5">
        {/* Tab Bar */}
        <div className="flex gap-2 bg-white rounded-2xl border border-[#e9ecef] p-1.5 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-[#c9a961] text-white shadow-sm"
                  : "text-[#6c757d] hover:text-[#1a1a1a] hover:bg-[#f4f5f7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Mode Warning */}
        {form.isLive && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">You are in LIVE mode</p>
              <p className="text-xs text-red-600 mt-0.5">Real money will be processed. Ensure your credentials are correct before saving.</p>
            </div>
          </div>
        )}

        {/* Bizify Status Banner */}
        {activeTab === "bizify" && (
          <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${
            form.apiKey && form.secretKey
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-amber-50 border border-amber-200"
          }`}>
            {form.apiKey && form.secretKey
              ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              : <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${form.apiKey && form.secretKey ? "text-emerald-700" : "text-amber-700"}`}>
                {form.apiKey && form.secretKey ? "Bizify — Connected & Live" : "Bizify — API Keys Required"}
              </p>
              <p className={`text-xs mt-0.5 ${form.apiKey && form.secretKey ? "text-emerald-600" : "text-amber-600"}`}>
                {form.apiKey && form.secretKey
                  ? "Payments are active. Guests are redirected to Bizify's secure checkout on booking."
                  : "Enter your Bizify public key, secret key, and merchant ID to enable payments."}
              </p>
            </div>
          </div>
        )}

        {/* Config Card */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f0f0f0]">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#c9a961] to-[#9a7b3c]" />
            <h2 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-lg">
              Bizify Settings
            </h2>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">
                  API Key
                </label>
                <PasswordInput
                  value={form.apiKey}
                  onChange={(v) => setField(activeTab, "apiKey", v)}
                  placeholder="Enter API key"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">
                  Secret Key
                </label>
                <PasswordInput
                  value={form.secretKey}
                  onChange={(v) => setField(activeTab, "secretKey", v)}
                  placeholder="Enter secret key"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={form.webhookUrl}
                  onChange={(e) => setField(activeTab, "webhookUrl", e.target.value)}
                  placeholder="https://yourdomain.com/api/webhooks/payment"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Bizify Extra */}
            {activeTab === "bizify" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f0f0f0]">
                <div>
                  <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">
                    Merchant ID
                  </label>
                  <input
                    value={(form.extra as BizifyExtra).merchantId ?? ""}
                    onChange={(e) => setExtra(activeTab, "merchantId", e.target.value)}
                    placeholder="BIZ-XXXXXXXX"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">
                    Business Name
                  </label>
                  <input
                    value={(form.extra as BizifyExtra).businessName ?? ""}
                    onChange={(e) => setExtra(activeTab, "businessName", e.target.value)}
                    placeholder="Golden Coast Stays Ltd."
                    className={inputClass}
                  />
                </div>
              </div>
            )}


            {/* Toggles */}
            <div className="space-y-4 pt-2 border-t border-[#f0f0f0]">
              <Switch
                checked={form.isLive}
                onChange={(v) => setField(activeTab, "isLive", v)}
                label="Live Mode (real transactions)"
              />
              <Switch
                checked={form.isActive}
                onChange={(v) => setField(activeTab, "isActive", v)}
                label="Set as Active Payment Provider"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave(activeTab)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  "Save Configuration"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Last updated note */}
        {configs[activeTab]?.updatedAt && (
          <p className="text-xs text-[#adb5bd] text-right pb-4">
            Last updated:{" "}
            {new Date(configs[activeTab].updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
