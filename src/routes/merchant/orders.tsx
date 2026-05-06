import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/merchant/orders")({
  component: OrdersPage,
});

type Order = {
  id: string; short_code: string | null; customer_name: string; customer_phone: string;
  status: string; total: number; created_at: string;
  order_items: { name: string; quantity: number }[];
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, short_code, customer_name, customer_phone, status, total, created_at, order_items(name, quantity)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setOrders((data as Order[]) ?? []));
  }, []);

  const filtered = orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (search) {
      const s = search.toLowerCase();
      const matches =
        (o.short_code ?? "").includes(search) ||
        o.id.toLowerCase().includes(s) ||
        o.customer_name.toLowerCase().includes(s) ||
        o.customer_phone.includes(search);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">All orders, newest first.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search code, name, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-display font-semibold text-primary">{o.short_code ? `#${o.short_code}` : `#${o.id.slice(0, 8).toUpperCase()}`}</td>
                <td className="px-4 py-3"><div>{o.customer_name}</div><div className="text-xs text-muted-foreground">{o.customer_phone}</div></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{o.order_items?.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td>
                <td className="px-4 py-3 font-semibold">₹{Number(o.total).toFixed(0)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs capitalize">{o.status}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
