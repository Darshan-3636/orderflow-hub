import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; name: string; sort_order: number; emoji: string | null };
type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  category_id: string | null;
  prep_time_minutes: number | null;
};

export const Route = createFileRoute("/_customer/explore")({
  component: ExplorePage,
});

const FALLBACK_EMOJI = "🍽️";

function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? []));
    supabase.from("menu_items").select("id,name,description,price,image_url,in_stock,category_id,prep_time_minutes").then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (activeCat !== "all") list = list.filter((i) => i.category_id === activeCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCat, query]);

  const grouped = useMemo(() => {
    if (activeCat !== "all") return [{ cat: categories.find((c) => c.id === activeCat) ?? null, items: filtered }];
    return categories
      .map((cat) => ({ cat, items: filtered.filter((i) => i.category_id === cat.id) }))
      .filter((g) => g.items.length > 0);
  }, [categories, filtered, activeCat]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Heading + search */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-semibold text-primary">
            <UtensilsCrossed className="h-3.5 w-3.5" /> Today's menu
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Explore the menu</h1>
          <p className="mt-2 text-muted-foreground">Everything we make, fresh today.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes…"
            className="h-11 rounded-full border-border/70 bg-card pl-10 shadow-soft"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="scrollbar-hide -mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <CatPill
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
          emoji="🍽️"
          label="All"
          count={items.length}
        />
        {categories.map((cat) => {
          const count = items.filter((i) => i.category_id === cat.id).length;
          return (
            <CatPill
              key={cat.id}
              active={activeCat === cat.id}
              onClick={() => setActiveCat(cat.id)}
              emoji={cat.emoji ?? FALLBACK_EMOJI}
              label={cat.name}
              count={count}
            />
          );
        })}
      </div>

      {/* Items */}
      <div className="mt-10 space-y-12">
        {grouped.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center">
            <p className="text-4xl">🥄</p>
            <p className="mt-3 font-display text-xl font-semibold">Nothing matches.</p>
            <p className="text-sm text-muted-foreground">Try a different search or category.</p>
          </div>
        )}
        {grouped.map(({ cat, items: catItems }) => (
          <section key={cat?.id ?? "uncat"}>
            {cat && activeCat === "all" && (
              <h2 className="mb-5 flex items-center gap-2 font-display text-2xl font-bold">
                <span className="text-2xl">{cat.emoji ?? FALLBACK_EMOJI}</span> {cat.name}
              </h2>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {catItems.map((item) => (
                <article
                  key={item.id}
                  className={`group flex overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant ${
                    !item.in_stock ? "opacity-60" : ""
                  }`}
                >
                  <div className="relative h-36 w-36 shrink-0 overflow-hidden bg-gradient-warm">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">{categories.find((c) => c.id === item.category_id)?.emoji ?? FALLBACK_EMOJI}</div>
                    )}
                    {!item.in_stock && (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    {item.prep_time_minutes != null && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <span>⏱</span> Ready in ~{item.prep_time_minutes} min
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="font-display text-xl font-bold text-primary">₹{Number(item.price).toFixed(0)}</span>
                      <Button
                        size="sm"
                        variant="hero"
                        disabled={!item.in_stock}
                        onClick={() => {
                          addItem({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url });
                          toast.success(`Added ${item.name}`);
                        }}
                      >
                        + Add
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function CatPill({
  active, onClick, emoji, label, count,
}: { active: boolean; onClick: () => void; emoji: string; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-smooth ${
        active
          ? "border-primary bg-gradient-hero text-primary-foreground shadow-elegant"
          : "border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-secondary"
      }`}
    >
      <span className="text-base">{emoji}</span>
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          active ? "bg-background/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
