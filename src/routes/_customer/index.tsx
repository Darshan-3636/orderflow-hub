import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_customer/")({
  component: HomePage,
});

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    supabase
      .from("menu_items")
      .select("id,name,description,price,image_url,in_stock,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  const isNew = (i: Item) => Date.now() - new Date(i.created_at).getTime() < SEVEN_DAYS;
  const newItems = items.filter(isNew).slice(0, 8);
  const featured = items.slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-warm">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-primary shadow-soft">
              <Sparkles className="h-3 w-3" /> Fresh today
            </span>
            <h1 className="font-display text-5xl font-bold leading-tight text-foreground sm:text-6xl">
              Honest food,<br />made with care.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Seasonal ingredients, simple recipes, generous portions. Order ahead and skip the line.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/explore">Browse menu <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-hero shadow-elegant" />
            <div className="relative flex h-full items-center justify-center p-10">
              <div className="font-display text-8xl text-primary-foreground/90">🌿</div>
            </div>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <Section title="Best sellers" icon={<Flame className="h-4 w-4" />} items={featured} addItem={addItem} />

      {/* Newly added */}
      {newItems.length > 0 && (
        <Section title="Newly added" icon={<Sparkles className="h-4 w-4" />} items={newItems} addItem={addItem} showNew />
      )}
    </div>
  );
}

function Section({
  title, icon, items, addItem, showNew,
}: { title: string; icon: React.ReactNode; items: Item[]; addItem: ReturnType<typeof useCart>["addItem"]; showNew?: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
          {title}
        </h2>
      </div>
      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {items.map((item) => (
          <article
            key={item.id}
            className={`group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant ${
              !item.in_stock ? "opacity-50" : ""
            }`}
          >
            <div className="relative h-40 bg-gradient-warm">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl">🍽️</div>
              )}
              {showNew && (
                <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-soft">
                  New
                </span>
              )}
              {!item.in_stock && (
                <span className="absolute right-3 top-3 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">
                  Out of stock
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-base font-semibold">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-primary">₹{Number(item.price).toFixed(0)}</span>
                <Button
                  size="sm"
                  variant="soft"
                  disabled={!item.in_stock}
                  onClick={() => {
                    addItem({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url });
                    toast.success(`Added ${item.name}`);
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
