const BIZIFY_BASE = "https://mybizify.com/api/v1";

function secretKey() {
  return process.env.BIZIFY_SECRET_KEY ?? "";
}

function publicKey() {
  return process.env.NEXT_PUBLIC_BIZIFY_PUBLIC_KEY ?? "";
}

function merchantId() {
  return process.env.BIZIFY_MERCHANT_ID ?? "";
}

export interface BizifyInitPayload {
  amount: number;
  email: string;
  name?: string;
  description?: string;
  callback_url?: string;
  currency?: string;
  metadata?: Record<string, string | number>;
}

export interface BizifyTransaction {
  reference: string;
  checkout_url: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "abandoned";
  created_at: string;
  paid_at?: string;
  customer?: { email: string; name: string };
  payment_method?: string;
}

// Initialize a payment — returns checkout_url to redirect the guest to
export async function initializeBizifyPayment(
  payload: BizifyInitPayload
): Promise<{ reference: string; checkout_url: string } | null> {
  const sk = secretKey();
  const mid = merchantId();

  if (!sk) {
    console.error("Bizify: BIZIFY_SECRET_KEY is not set");
    return null;
  }

  const body = {
    ...payload,
    currency: payload.currency ?? "GHS",
    ...(mid ? { merchant_id: mid } : {}),
  };

  console.log(`Bizify initialize: key prefix=${sk.slice(0, 12)}... mid=${mid ? mid.slice(0, 8) + "..." : "none"}`);

  try {
    const res = await fetch(`${BIZIFY_BASE}/payment/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sk}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();

    if (!res.ok) {
      console.error(`Bizify initialize failed [${res.status}]:`, raw);
      return null;
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Bizify initialize: non-JSON response:", raw);
      return null;
    }

    // Handle both { data: { reference, checkout_url } } and flat { reference, checkout_url }
    const payload_data = (data.data ?? data) as Record<string, unknown>;
    const reference = payload_data.reference as string | undefined;
    const checkout_url = (payload_data.checkout_url ?? payload_data.checkoutUrl ?? payload_data.payment_url) as string | undefined;

    if (!reference || !checkout_url) {
      console.error("Bizify initialize: unexpected response shape:", raw);
      return null;
    }

    return { reference, checkout_url };
  } catch (err) {
    console.error("initializeBizifyPayment error:", err);
    return null;
  }
}

// Verify a payment by Bizify reference — call after guest returns from checkout
export async function verifyBizifyPayment(
  bizifyReference: string
): Promise<BizifyTransaction | null> {
  try {
    const res = await fetch(`${BIZIFY_BASE}/payment/verify/${bizifyReference}`, {
      headers: {
        Authorization: `Bearer ${secretKey()}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Bizify verify failed ${res.status}: ${err}`);
      return null;
    }

    const data = await res.json();
    return data.data as BizifyTransaction;
  } catch (err) {
    console.error("verifyBizifyPayment error:", err);
    return null;
  }
}

// Verify HMAC signature from Bizify webhook
export function verifyBizifyWebhook(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return !secret;
  try {
    const crypto = require("crypto") as typeof import("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
