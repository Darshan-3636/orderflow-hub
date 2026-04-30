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
    const status = await getOrderStatus(data.merchantOrderId);
    return { state: status.state };
  });
