import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChefHat, CheckCircle2, Clock, Package, Search, Phone, User, Hash } from "lucide-react";

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
    <div className="-m-4 flex min-h-[calc(100vh-3.5rem)] flex-col sm:-m-6">
      <div className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Cook Mode</h1>
          <p className="text-xs text-muted-foreground">Live kitchen display — auto-refreshing</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success" data-tick={tick}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> LIVE
        </div>
      </div>

      {loading ? (
        <p className="p-8 text-muted-foreground">Loading orders…</p>
      ) : (
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          <Column
            title="Cooking"
            subtitle="In the kitchen"
            icon={<ChefHat className="h-6 w-6" />}
            tone="cooking"
            orders={pending}
            actionLabel="Mark ready"
            onAction={(id) => updateStatus(id, "ready")}
          />
          <Column
            title="Ready"
            subtitle="For pickup"
            icon={<Package className="h-6 w-6" />}
            tone="ready"
            orders={ready}
            actionLabel="Complete"
            onAction={(id) => updateStatus(id, "completed")}
            secondaryActionLabel="Move to cooking"
            onSecondaryAction={(id) => updateStatus(id, "pending")}
          />
        </div>
      )}
    </div>
  );
}

function Column({
  title, subtitle, icon, tone, orders, actionLabel, onAction, secondaryActionLabel, onSecondaryAction,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "cooking" | "ready";
  orders: Order[];
  actionLabel: string;
  onAction: (id: string) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (id: string) => void;
}) {
  const headerBg = tone === "cooking" ? "bg-warning/20 border-warning/30" : "bg-success/20 border-success/30";
  const iconBg = tone === "cooking" ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground";
  const sectionBg = tone === "cooking" ? "bg-warning/5" : "bg-success/5";

  return (
    <section className={`flex flex-col border-border/60 ${sectionBg} ${tone === "cooking" ? "lg:border-r" : ""}`}>
      <header className={`flex items-center justify-between gap-3 border-b px-6 py-4 ${headerBg}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft ${iconBg}`}>{icon}</div>
          <div>
            <h2 className="font-display text-2xl font-extrabold">{title}</h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-full bg-background px-4 py-1.5 font-display text-2xl font-extrabold shadow-soft">
          {orders.length}
        </span>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
          <div className="text-5xl opacity-30">🍳</div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">No orders here.</p>
        </div>
      ) : (
        <ul className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {orders.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-3xl bg-card shadow-soft">
              <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
                <div>
                  <div className="font-display text-5xl font-extrabold leading-none tracking-tight">#{o.short_code}</div>
                  <div className="mt-2 text-base font-bold">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-foreground">
                  <Clock className="h-3.5 w-3.5" />{timeAgo(o.created_at)}
                </div>
              </div>
              <ul className="space-y-2 p-5 text-base">
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                    <span className="font-medium">{it.name}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 font-display text-sm font-bold">×{it.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-2 p-5 pt-0 sm:grid-cols-1">
                <Button
                  variant={tone === "cooking" ? "sage" : "charcoal"}
                  size="lg"
                  className="w-full text-base"
                  onClick={() => onAction(o.id)}
                >
                  <CheckCircle2 className="mr-1 h-5 w-5" />{actionLabel}
                </Button>
                {onSecondaryAction && secondaryActionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSecondaryAction(o.id)}
                  >
                    <ChefHat className="mr-1 h-4 w-4" />{secondaryActionLabel}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
