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

type OrderItem = { id: string; name: string; quantity: number; price?: number };
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

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [notFoundOpen, setNotFoundOpen] = useState(false);

  const runSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    const isCode = /^\d{4}$/.test(q);
    const base = supabase
      .from("orders")
      .select("id, short_code, customer_name, customer_phone, status, total, created_at, ready_at, order_items(id, name, quantity, price)")
      .order("created_at", { ascending: false })
      .limit(1);
    const { data } = isCode
      ? await base.eq("short_code", q)
      : await base.ilike("customer_name", `%${q}%`);
    setSearching(false);
    const hit = (data as Order[] | null)?.[0];
    if (hit) setFoundOrder(hit);
    else setNotFoundOpen(true);
  };

  return (
    <div className="-m-4 flex min-h-[calc(100vh-3.5rem)] flex-col sm:-m-6">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Cook Mode</h1>
          <p className="text-xs text-muted-foreground">Live kitchen display — auto-refreshing</p>
        </div>
        <div className="flex flex-1 items-center gap-3 sm:max-w-xl sm:justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              placeholder="Search by 4-digit code or customer name…"
              className="h-11 rounded-full border-border/70 bg-background pl-10 pr-4 shadow-soft"
            />
          </div>
          <Button onClick={runSearch} disabled={searching || !search.trim()} variant="hero" size="lg" className="rounded-full">
            {searching ? "Searching…" : "Search"}
          </Button>
          <div className="hidden items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success sm:flex" data-tick={tick}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> LIVE
          </div>
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

      <OrderDetailDialog order={foundOrder} onOpenChange={(o) => { if (!o) setFoundOrder(null); }} />
      <Dialog open={notFoundOpen} onOpenChange={setNotFoundOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Order Not Found</DialogTitle>
            <DialogDescription>
              No order matches "{search.trim()}". Try a different code or name.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setNotFoundOpen(false)} variant="hero">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusLabel(s: string) {
  if (s === "pending") return { label: "Cooking", cls: "bg-warning/20 text-warning border-warning/30" };
  if (s === "ready") return { label: "Ready for pickup", cls: "bg-success/20 text-success border-success/30" };
  if (s === "completed") return { label: "Completed", cls: "bg-secondary text-foreground border-border" };
  return { label: s, cls: "bg-secondary text-foreground border-border" };
}

function OrderDetailDialog({ order, onOpenChange }: { order: (Order & { order_items: (OrderItem & { price?: number })[] }) | null; onOpenChange: (open: boolean) => void }) {
  const open = !!order;
  const st = order ? statusLabel(order.status) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {order && st && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2 font-display text-2xl">
                <span className="inline-flex items-center gap-2"><Hash className="h-5 w-5 text-muted-foreground" />{order.short_code}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
              </DialogTitle>
              <DialogDescription>Order details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">{order.customer_name}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{order.customer_phone}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Placed {timeAgo(order.created_at)} ago</span></div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Items</div>
                <ul className="divide-y divide-border/40">
                  {order.order_items?.map((it) => (
                    <li key={it.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium">{it.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 font-display text-xs font-bold">×{it.quantity}</span>
                        {typeof it.price === "number" && (
                          <span className="text-muted-foreground">₹{(Number(it.price) * it.quantity).toFixed(0)}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gradient-hero px-4 py-3 text-primary-foreground">
                <span className="font-display text-base font-bold">Total</span>
                <span className="font-display text-2xl font-extrabold">₹{Number(order.total).toFixed(0)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="hero" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
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
