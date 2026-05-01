import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { verifyPhonePePayment } from "@/server/phonepe.functions";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Search = z.object({
  moid: z.string().optional(),
  cart: z.string().optional(),
});

export const Route = createFileRoute("/_customer/payment/return")({
  validateSearch: (s) => Search.parse(s),
  component: PaymentReturn,
});

function PaymentReturn() {
  const { moid } = useSearch({ from: "/_customer/payment/return" });
  const { items, subtotal, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const verify = useServerFn(verifyPhonePePayment);
  const [state, setState] = useState<"checking" | "success" | "failed">("checking");
  const [code, setCode] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!moid || !user) {
        setState("failed");
        return;
      }
      try {
        // Server polls PhonePe for ~12s; we additionally retry a few times
        // on the client so slow mobile QR confirmations still resolve.
        let finalState = "PENDING";
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await verify({ data: { merchantOrderId: moid } });
          finalState = res.state;
          if (finalState === "COMPLETED" || finalState === "FAILED") break;
          await new Promise((r) => setTimeout(r, 3000));
        }
        if (finalState !== "COMPLETED") {
          setState("failed");
          return;
        }
        // Payment confirmed — place order now
        if (items.length === 0) {
          // Cart got cleared (e.g. another tab) — still consider it success but no order to place
          setState("success");
          return;
        }
        const tax = subtotal * 0.05;
        const total = subtotal + tax;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            customer_name: profile?.full_name ?? user.email ?? "Customer",
            customer_phone: profile?.phone ?? "",
            subtotal,
            tax,
            total,
            status: "pending",
            payment_status: "paid",
            short_code: "",
          })
          .select("id, short_code")
          .single();
        if (error || !order) {
          toast.error(error?.message ?? "Order creation failed after payment");
          setState("failed");
          return;
        }
        const { error: itemsErr } = await supabase.from("order_items").insert(
          items.map((i) => ({
            order_id: order.id,
            menu_item_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        );
        if (itemsErr) {
          toast.error(itemsErr.message);
          setState("failed");
          return;
        }
        clear();
        setCode(order.short_code);
        setState("success");
      } catch (e) {
        console.error(e);
        setState("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moid, user, authLoading]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      {state === "checking" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please don't close this tab.</p>
        </>
      )}
      {state === "success" && (
        <>
          <div className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-success">
            <CheckCircle2 className="h-4 w-4" /> Payment successful
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            Order confirmed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Show this code at the counter to pick up your order.
          </p>

          {code && (
            <div className="relative mt-8 w-full max-w-md">
              {/* Ticket */}
              <div
                className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-elegant"
                style={{
                  // notches on the sides for the ticket look
                  WebkitMaskImage:
                    "radial-gradient(circle at 0 50%, transparent 14px, #000 14px), radial-gradient(circle at 100% 50%, transparent 14px, #000 14px)",
                  WebkitMaskComposite: "source-in",
                  maskComposite: "intersect",
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Pickup Code
                </div>
                <div className="mt-3 flex justify-center gap-2 sm:gap-3">
                  {code.split("").map((d, i) => (
                    <span
                      key={i}
                      className="flex h-20 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-mint font-display text-5xl font-extrabold text-primary shadow-soft sm:h-24 sm:w-20 sm:text-6xl"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 border-t border-dashed border-border/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Verde Kitchen
                  </span>
                  <div className="h-px flex-1 border-t border-dashed border-border/70" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this code handy — we'll call it out when your order is ready.
                </p>
              </div>
            </div>
          )}

          <Button variant="hero" size="xl" className="mt-8" onClick={() => navigate({ to: "/orders" })}>
            View my orders
          </Button>
        </>
      )}
      {state === "failed" && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Payment not completed</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your card/UPI was not charged. Please try again.</p>
          <Button variant="hero" className="mt-6" onClick={() => navigate({ to: "/cart" })}>
            Back to cart
          </Button>
        </>
      )}
    </div>
  );
}
