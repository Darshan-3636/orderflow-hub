import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ReviewDialog } from "@/components/ReviewDialog";
import { toast } from "sonner";
import { Star, RotateCcw, CheckCircle2, Clock, Package } from "lucide-react";

type Order = {
  id: string;
  short_code: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { name: string; quantity: number; price: number; menu_item_id: string | null; image_url?: string | null }[];
};

export const Route = createFileRoute("/_customer/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { addItem, clear } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewOrder, setReviewOrder] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("id, short_code, status, total, created_at, order_items(name, quantity, price, menu_item_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    const { data: rs } = await supabase.from("reviews").select("order_id").eq("user_id", user.id);
    setReviewedIds(new Set((rs ?? []).map((r) => r.order_id)));
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/" }); return; }
    load();
  }, [user, loading, navigate, load]);

  // realtime status updates for this customer
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`cust-orders-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  // Review prompt is opened only via the explicit "Rate" button on a completed order.
  // We intentionally do NOT auto-open it on page load to avoid showing it twice
  // or showing it during normal history browsing.

  const reorder = async (o: Order) => {
    clear();
    const ids = o.order_items.map((i) => i.menu_item_id).filter(Boolean) as string[];
    const { data: live } = await supabase.from("menu_items").select("id, name, price, image_url, in_stock").in("id", ids.length ? ids : [""]);
    const byId = new Map((live ?? []).map((m) => [m.id, m]));
    let added = 0, skipped = 0;
    o.order_items.forEach((i) => {
      const m = i.menu_item_id ? byId.get(i.menu_item_id) : null;
      if (!m || !m.in_stock) { skipped++; return; }
      for (let n = 0; n < i.quantity; n++) addItem({ id: m.id, name: m.name, price: Number(m.price), image_url: m.image_url });
      added++;
    });
    if (added) toast.success(`Reordered${skipped ? ` (${skipped} item(s) unavailable)` : ""}`);
    else toast.error("None of the items are available right now");
    if (added) navigate({ to: "/cart" });
  };

  const statusUI = (s: string) => {
    if (s === "pending") return { icon: <Clock className="h-3.5 w-3.5" />, label: "Preparing", cls: "bg-warning/20 text-warning-foreground" };
    if (s === "ready") return { icon: <Package className="h-3.5 w-3.5" />, label: "Ready for pickup", cls: "bg-success/20 text-success-foreground" };
    if (s === "completed") return { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Completed", cls: "bg-secondary text-secondary-foreground" };
    return { icon: null, label: s, cls: "bg-secondary text-secondary-foreground" };
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Your orders</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => {
            const s = statusUI(o.status);
            return (
              <div key={o.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg font-semibold">Pickup code: <span className="text-primary">{o.short_code}</span></div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>{s.icon}{s.label}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {o.order_items?.map((it, idx) => <li key={idx}>{it.quantity}× {it.name}</li>)}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold">Total: ₹{Number(o.total).toFixed(0)}</span>
                  <div className="flex gap-2">
                    {o.status === "completed" && !reviewedIds.has(o.id) && (
                      <Button variant="soft" size="sm" onClick={() => setReviewOrder(o.id)}><Star className="mr-1 h-3.5 w-3.5" />Rate</Button>
                    )}
                    <Button variant="soft" size="sm" onClick={() => reorder(o)}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reorder</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-8">
        <Button variant="soft" onClick={() => navigate({ to: "/" })}>Back to home</Button>
      </div>
      <ReviewDialog
        open={!!reviewOrder}
        onOpenChange={(v) => {
          if (!v) {
            // mark as handled in local state so it doesn't reopen if skipped
            if (reviewOrder) setReviewedIds((prev) => new Set(prev).add(reviewOrder));
            setReviewOrder(null);
          }
        }}
        orderId={reviewOrder}
      />
    </div>
  );
}
