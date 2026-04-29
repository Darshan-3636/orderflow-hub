import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  short_code: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { name: string; quantity: number; price: number; menu_item_id: string | null }[];
};

export const Route = createFileRoute("/_customer/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/" }); return; }
    supabase
      .from("orders")
      .select("id, short_code, status, total, created_at, order_items(name, quantity, price, menu_item_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Order[]) ?? []));
  }, [user, loading, navigate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Your orders</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg font-semibold">Pickup code: <span className="text-primary">{o.short_code}</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">{o.status}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.order_items?.map((it, idx) => (
                  <li key={idx}>{it.quantity}× {it.name}</li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold">Total: ₹{Number(o.total).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8">
        <Button variant="soft" onClick={() => navigate({ to: "/" })}>Back to home</Button>
      </div>
    </div>
  );
}
