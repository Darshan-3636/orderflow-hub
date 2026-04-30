import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { createCheckoutPayment, getOrderStatus } from "./phonepe.server";

const InitiateInput = z.object({
  amount: z.number().positive().max(1_000_000), // INR rupees
  cartHash: z.string().min(1).max(64),
});

export const initiatePhonePePayment = createServerFn({ method: "POST" })
  .inputValidator((input) => InitiateInput.parse(input))
  .handler(async ({ data }) => {
    const host = getRequestHost();
    const proto = host.includes("localhost") ? "http" : "https";
    const merchantOrderId = `MO_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const redirectUrl = `${proto}://${host}/payment/return?moid=${merchantOrderId}&cart=${encodeURIComponent(data.cartHash)}`;

    const result = await createCheckoutPayment({
      merchantOrderId,
      amountPaise: Math.round(data.amount * 100),
      redirectUrl,
    });
    return { redirectUrl: result.redirectUrl, merchantOrderId };
  });

const VerifyInput = z.object({ merchantOrderId: z.string().min(1).max(80) });

export const verifyPhonePePayment = createServerFn({ method: "POST" })
  .inputValidator((input) => VerifyInput.parse(input))
  .handler(async ({ data }) => {
    // PhonePe can take a few seconds to reconcile a mobile QR payment.
    // Poll the status endpoint a few times before giving up so the desktop
    // redirect doesn't beat the backend reconciliation.
    const terminal = new Set(["COMPLETED", "FAILED"]);
    let last = "PENDING";
    const delays = [0, 1500, 2000, 2500, 3000, 3000]; // ~12s total
    for (const wait of delays) {
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      try {
        const status = await getOrderStatus(data.merchantOrderId);
        last = status.state ?? "PENDING";
        if (terminal.has(last)) return { state: last };
      } catch (e) {
        // network blip — keep trying
        console.error("PhonePe status poll error:", e);
      }
    }
    return { state: last };
  });
