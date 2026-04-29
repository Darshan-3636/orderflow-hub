import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, ArrowRight, Leaf, Clock, Heart, ChefHat, Star } from "lucide-react";
import { toast } from "sonner";
import heroFood from "@/assets/hero-food.jpg";

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
      {/* Hero — charcoal premium */}
      <section className="relative mx-auto mt-4 max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-charcoal px-4 sm:mx-6 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative grid items-center gap-10 py-14 md:grid-cols-2 md:gap-6 md:py-20">
          <div className="relative z-10 flex flex-col">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-charcoal-foreground/15 bg-charcoal-foreground/10 px-3.5 py-1.5 text-xs font-semibold text-charcoal-foreground backdrop-blur">
              <Leaf className="h-3.5 w-3.5" /> Farm-to-table, daily
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] text-charcoal-foreground sm:text-6xl md:text-7xl">
              Fresh.<br />Healthy.<br />
              <span className="relative inline-block">
                <span className="relative z-10 text-accent">Yours.</span>
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-charcoal-foreground/70">
              Seasonal ingredients, simple recipes, generous portions. Order ahead and skip the line.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/explore">Order now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="xl" className="border border-charcoal-foreground/20 bg-charcoal-foreground/10 text-charcoal-foreground hover:bg-charcoal-foreground/15">
                <Link to="/orders">View past orders</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-charcoal bg-gradient-coral text-xs font-bold text-accent-foreground"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-accent">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-charcoal-foreground/60">Loved by 2,000+ guests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-coral opacity-25 blur-3xl" />
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-elegant">
              <img
                src={heroFood}
                alt="Fresh seasonal salad with herbs and pesto"
                className="h-full w-full object-cover"
                width={1024}
                height={1024}
              />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-background/95 px-3.5 py-2 text-xs font-bold shadow-soft backdrop-blur">
                <Leaf className="h-3.5 w-3.5 text-primary" /> 100% fresh
              </div>
              <div className="absolute bottom-5 right-5 flex items-center gap-2.5 rounded-2xl bg-background/95 px-4 py-3 shadow-elegant backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-display text-sm font-extrabold">~15 min</div>
                  <div className="text-[10px] text-muted-foreground">Avg. prep time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:grid-cols-3 sm:p-6">
          <Feature icon={<ChefHat className="h-5 w-5" />} title="Made to order" desc="Cooked when you order, never sitting." />
          <Feature icon={<Leaf className="h-5 w-5" />} title="Local & seasonal" desc="Ingredients from nearby growers." />
          <Feature icon={<Heart className="h-5 w-5" />} title="Honest pricing" desc="No hidden fees, ever." />
        </div>
      </section>

      <Section title="Best sellers" subtitle="Guest favourites you'll come back for" icon={<Flame className="h-4 w-4" />} items={featured} addItem={addItem} />

      {newItems.length > 0 && (
        <Section
          title="Newly added"
          subtitle="Fresh on the menu this week"
          icon={<Sparkles className="h-4 w-4" />}
          items={newItems}
          addItem={addItem}
          showNew
        />
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-charcoal p-8 shadow-elegant sm:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-charcoal-foreground sm:text-4xl">
                Hungry? Skip the line.
              </h2>
              <p className="mt-2 max-w-lg text-charcoal-foreground/75">
                Place your order, get a 4-digit pickup code, and we'll have it ready when you arrive.
              </p>
            </div>
            <Button asChild variant="hero" size="xl">
              <Link to="/explore">Start an order <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl p-3 transition-smooth hover:bg-secondary/50">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Section({
  title, subtitle, icon, items, addItem, showNew,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  items: Item[];
  addItem: ReturnType<typeof useCart>["addItem"];
  showNew?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-3xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
              {icon}
            </span>
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link to="/explore" className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex">
          View all →
        </Link>
      </div>
      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {items.map((item) => (
          <article
            key={item.id}
            className={`group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant ${
              !item.in_stock ? "opacity-60" : ""
            }`}
          >
            <div className="relative h-44 overflow-hidden bg-gradient-warm">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">🍽️</div>
              )}
              {showNew && (
                <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-soft">
                  ✨ New
                </span>
              )}
              {!item.in_stock && (
                <span className="absolute right-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase text-destructive-foreground">
                  Out of stock
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-base font-semibold">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-3 flex items-center justify-between">
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
  );
}
