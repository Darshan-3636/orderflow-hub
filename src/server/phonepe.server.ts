// PhonePe sandbox (UAT) server-only helpers — v2 OAuth Standard Checkout
// Docs: https://developer.phonepe.com/v1/reference/pg-create-payment-checkout-page

const AUTH_BASE = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PG_BASE = "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2";

type TokenCache = { token: string; expiresAt: number } | null;
let cache: TokenCache = null;

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION ?? "1";
  if (!clientId || !clientSecret) throw new Error("PhonePe credentials not configured");

  if (cache && cache.expiresAt > Date.now() + 60_000) return cache.token;

  const body = new URLSearchParams({
    client_id: clientId,
    client_version: clientVersion,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(AUTH_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`PhonePe auth failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  // expires_at is unix seconds in PhonePe's response
  const expiresAt = data.expires_at ? Number(data.expires_at) * 1000 : Date.now() + 30 * 60_000;
  cache = { token: data.access_token, expiresAt };
  return data.access_token;
}

export async function createCheckoutPayment(opts: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
}): Promise<{ redirectUrl: string; orderId: string }> {
  const token = await getAccessToken();
  const payload = {
    merchantOrderId: opts.merchantOrderId,
    amount: opts.amountPaise,
    paymentFlow: {
      type: "PG_CHECKOUT",
      message: "Order payment",
      merchantUrls: { redirectUrl: opts.redirectUrl },
    },
  };
  const res = await fetch(`${PG_BASE}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirectUrl) {
    throw new Error(`PhonePe pay failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return { redirectUrl: data.redirectUrl, orderId: data.orderId };
}

export async function getOrderStatus(merchantOrderId: string): Promise<{
  state: string; // COMPLETED | FAILED | PENDING
  raw: any;
}> {
  const token = await getAccessToken();
  const res = await fetch(`${PG_BASE}/order/${encodeURIComponent(merchantOrderId)}/status`, {
    headers: { Authorization: `O-Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PhonePe status failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return { state: data.state, raw: data };
}
