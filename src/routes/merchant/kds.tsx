import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChefHat, CheckCircle2, Clock, Package } from "lucide-react";

export const Route = createFileRoute("/merchant/kds")({
  component: KDSPage,
});

type OrderItem = { id: string; name: string; quantity: number };
type Order = {
  id: string;
  short_code: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  created_at: string;
  ready_at: string | null;
  order_items: OrderItem[];
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, short_code, customer_name, customer_phone, status, total, created_at, ready_at, order_items(id, name, quantity)")
      .in("status", ["pending", "ready"])
      .order("created_at", { ascending: true });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel("kds-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  // re-render every 30s for elapsed time
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const updateStatus = async (id: string, status: "pending" | "ready" | "completed") => {
    const patch: { status: string; ready_at?: string | null; completed_at?: string | null } = { status };
    if (status === "pending") { patch.ready_at = null; patch.completed_at = null; }
    if (status === "ready") patch.ready_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const pending = orders.filter((o) => o.status === "pending");
  const ready = orders.filter((o) => o.status === "ready");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Cook Mode</h1>
          <p className="text-muted-foreground">Live kitchen display — auto-refreshing.</p>
        </div>
        <div className="text-xs text-muted-foreground" data-tick={tick}>● Live</div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading orders…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Column
            title="Pending"
            icon={<ChefHat className="h-5 w-5" />}
            color="warning"
            orders={pending}
            actionLabel="Mark ready"
            onAction={(id) => updateStatus(id, "ready")}
          />
          <Column
            title="Ready for pickup"
            icon={<Package className="h-5 w-5" />}
            color="success"
            orders={ready}
            actionLabel="Complete order"
            onAction={(id) => updateStatus(id, "completed")}
          />
        </div>
      )}
    </div>
  );
}

function Column({
  title, icon, color, orders, actionLabel, onAction,
}: {
  title: string;
  icon: React.ReactNode;
  color: "warning" | "success";
  orders: Order[];
  actionLabel: string;
  onAction: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">{icon}{title}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${color === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-success/20 text-success-foreground"}`}>
          {orders.length}
        </span>
      </header>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No orders here.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-border/60 bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-2xl font-bold text-primary">#{o.short_code}</div>
                  <div className="text-sm font-medium">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{timeAgo(o.created_at)}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex justify-between border-b border-border/40 pb-1 last:border-0">
                    <span>{it.name}</span>
                    <span className="font-semibold">×{it.quantity}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={color === "warning" ? "hero" : "soft"}
                size="sm"
                className="mt-3 w-full"
                onClick={() => onAction(o.id)}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />{actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
