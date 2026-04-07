const BIZIFY_BASE = "https://mybizify.com/api/v1";

function secretKey() {
  return process.env.BIZIFY_SECRET_KEY ?? "";
}

export interface BizifyInitPayload {
  amount: number;
  email: string;
  name?: string;
  description?: string;
  callback_url?: string;
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
  try {
    const res = await fetch(`${BIZIFY_BASE}/payment/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Bizify initialize failed ${res.status}: ${err}`);
      return null;
    }

    const data = await res.json();
    return {
      reference: data.data.reference,
      checkout_url: data.data.checkout_url,
    };
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
