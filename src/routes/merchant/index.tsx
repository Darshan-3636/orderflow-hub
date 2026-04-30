import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export const Route = createFileRoute("/merchant/")({
  component: MerchantHome,
});

type Order = { id: string; total: number; status: string; created_at: string; order_items: { name: string; quantity: number; price: number }[] };

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: "short", year: "numeric" });

const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

function MerchantHome() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, total, status, created_at, order_items(name, quantity, price)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Order[]) ?? []));
  }, []);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
    const daysElapsed = today.getDate();
    const daysInLastMonth = getDaysInMonth(lastMonthStart);

    const todayOrders = orders.filter((o) => new Date(o.created_at) >= today);
    const monthOrders = orders.filter((o) => new Date(o.created_at) >= monthStart);
    const lastMonthOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const sum = (arr: Order[]) => arr.reduce((s, o) => s + Number(o.total), 0);
    const monthRev = sum(monthOrders);
    const lastMonthRev = sum(lastMonthOrders);
    const currentDailyAvg = monthRev / Math.max(daysElapsed, 1);
    const previousDailyAvg = lastMonthRev / Math.max(daysInLastMonth, 1);
    const dailyGrowth = previousDailyAvg > 0
      ? ((currentDailyAvg - previousDailyAvg) / previousDailyAvg) * 100
      : currentDailyAvg > 0 ? 100 : 0;
    const isDecline = dailyGrowth < 0;

    const monthlyTotals = new Map<string, { revenue: number; label: string }>();
    orders.forEach((order) => {
      const date = new Date(order.created_at);
      const key = getMonthKey(date);
      const current = monthlyTotals.get(key) ?? { revenue: 0, label: getMonthLabel(date) };
      monthlyTotals.set(key, { ...current, revenue: current.revenue + Number(order.total) });
    });
    const bestMonth = Array.from(monthlyTotals.values()).sort((a, b) => b.revenue - a.revenue)[0];
    const peakPercent = bestMonth?.revenue ? (monthRev / bestMonth.revenue) * 100 : 0;

    // 14-day trend
    const days: { day: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const slice = orders.filter((o) => { const t = new Date(o.created_at); return t >= d && t < next; });
      days.push({ day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), revenue: sum(slice), orders: slice.length });
    }

    // Best sellers
    const counts = new Map<string, number>();
    monthOrders.forEach((o) => o.order_items?.forEach((it) => counts.set(it.name, (counts.get(it.name) ?? 0) + it.quantity)));
    const best = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, qty]) => ({ name, qty }));

    return {
      todayRev: sum(todayOrders), todayCount: todayOrders.length,
      monthRev, monthCount: monthOrders.length, dailyGrowth, isDecline, currentDailyAvg, previousDailyAvg, daysElapsed,
      peakPercent, bestMonthLabel: bestMonth?.label ?? "No record yet",
      pending: orders.filter((o) => o.status === "pending").length,
      days, best,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">A quick pulse on today and this month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Stat label="Today's revenue" value={`₹${stats.todayRev.toFixed(0)}`} sub={`${stats.todayCount} orders`} />
        <Stat label="Pending now" value={String(stats.pending)} sub="awaiting kitchen" />
        <Stat label="Daily average" value={`₹${stats.currentDailyAvg.toFixed(0)}`} sub={`${stats.daysElapsed} days elapsed`} />
        <Stat
          label={stats.isDecline ? "Decline rate" : "Daily MoM growth"}
          value={`${stats.isDecline ? "↓ " : "+"}${stats.dailyGrowth.toFixed(1)}%`}
          sub={`vs ₹${stats.previousDailyAvg.toFixed(0)}/day last month`}
          highlight={!stats.isDecline}
        />
        <Stat
          label="Peak benchmark"
          value={`${stats.peakPercent.toFixed(0)}%`}
          sub={`of all-time record (${stats.bestMonthLabel})`}
          highlight
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Last 14 days — Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={stats.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Best sellers (this month)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stats.best} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={110} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="qty" fill="var(--primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${highlight ? "text-success" : "text-primary"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
