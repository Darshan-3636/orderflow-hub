import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, ArrowRight, Leaf, Clock, BookOpen, Brain, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import campusImg from "@/assets/msrit-campus.webp";

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
    <div className="w-full">
      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-charcoal sm:rounded-[2.5rem]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 md:grid-cols-2 md:gap-8 md:py-20">
            <div className="relative z-10 flex flex-col">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-charcoal-foreground/15 bg-charcoal-foreground/10 px-3.5 py-1.5 text-xs font-semibold text-charcoal-foreground backdrop-blur">
                <MapPin className="h-3.5 w-3.5" /> Inside the MSRIT Canteen
              </span>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-charcoal-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Brain food.<br />
                <span className="text-accent">Farm-to-Campus.</span>
              </h1>
              <p className="mt-5 max-w-md text-base text-charcoal-foreground/75 sm:text-lg">
                Fresh greens and premium proteins, sourced daily — built to fuel
                long lab sessions, back-to-back lectures, and last-minute submissions.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild variant="hero" size="xl">
                  <Link to="/explore">Order now <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="xl" className="border border-charcoal-foreground/20 bg-charcoal-foreground/10 text-charcoal-foreground hover:bg-charcoal-foreground/15">
                  <Link to="/orders">My orders</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6">
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
                    <p className="text-xs text-charcoal-foreground/60">Loved by 2,000+ MSRITians</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative mx-auto w-full max-w-lg md:max-w-none">
              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-coral opacity-25 blur-3xl" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-elegant sm:rounded-[2.5rem]">
                <img
                  src={campusImg}
                  alt="MSRIT campus — home of our canteen kitchen"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-background/95 px-3.5 py-2 text-xs font-bold shadow-soft backdrop-blur">
                  <Leaf className="h-3.5 w-3.5 text-primary" /> Sourced today
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-2xl bg-background/95 px-4 py-3 shadow-elegant backdrop-blur">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                      <Clock className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-extrabold">~12 min</div>
                      <div className="text-[10px] text-muted-foreground">Between lectures</div>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2.5 sm:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                      <MapPin className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-extrabold">MSRIT</div>
                      <div className="text-[10px] text-muted-foreground">Main canteen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:grid-cols-3 sm:p-6">
          <Feature icon={<Brain className="h-5 w-5" />} title="Fuel your focus" desc="No grease, no slumps — built to keep you sharp through Engineering Physics." />
          <Feature icon={<Leaf className="h-5 w-5" />} title="Fresh today" desc="Greens & proteins delivered to the canteen kitchen each morning." />
          <Feature icon={<BookOpen className="h-5 w-5" />} title="Made for students" desc="Honest pricing, generous portions, ready between bells." />
        </div>
      </section>

      {/* MSRIT Pitstop map / blocks */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl bg-gradient-warm p-6 shadow-soft sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" /> Find us on campus
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              Your daily pitstop — Main Block to Apex.
            </h2>
            <p className="mt-3 text-muted-foreground">
              We're right in the heart of the MSRIT Canteen. Whether you're headed
              to a 9 AM at LHC or coming out of a late ESB lab, we're a few steps away.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { name: "Apex Block", mins: "2 min" },
              { name: "LHC", mins: "3 min" },
              { name: "DES", mins: "4 min" },
              { name: "ESB", mins: "5 min" },
              { name: "Multipurpose", mins: "3 min" },
            ].map((b) => (
              <div key={b.name} className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-soft">
                <div className="font-display text-base font-bold">{b.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">~{b.mins} walk</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section title="Today's hot picks" subtitle="Cooked fresh, going fast" icon={<Flame className="h-4 w-4" />} items={featured} addItem={addItem} />

      {newItems.length > 0 && (
        <Section
          title="New this week"
          subtitle="Just added to the menu"
          icon={<Sparkles className="h-4 w-4" />}
          items={newItems}
          addItem={addItem}
          showNew
        />
      )}

      {/* Ingredient transparency */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            <Leaf className="h-3.5 w-3.5" /> Ingredient transparency
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Where your food comes from.
          </h2>
          <p className="mt-3 text-muted-foreground">
            We believe you should know what's on your plate. Every ingredient,
            every morning, traceable to the source.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left">
                <th className="px-5 py-3 font-display font-bold">Ingredient</th>
                <th className="px-5 py-3 font-display font-bold">Sourced from</th>
                <th className="hidden px-5 py-3 font-display font-bold sm:table-cell">Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                ["Leafy greens & herbs", "KR Market, Bengaluru", "Daily, 6 AM"],
                ["Tomatoes & vegetables", "Hopcoms, Yelahanka", "Daily"],
                ["Paneer & dairy", "Nandini, Karnataka", "Twice daily"],
                ["Chicken & eggs", "Local farm, Doddaballapur", "Every morning"],
                ["Cold-pressed oils", "Sahyadri Farms", "Weekly"],
                ["Rice & grains", "Mandya direct trade", "Weekly"],
              ].map(([i, src, freq]) => (
                <tr key={i} className="transition-smooth hover:bg-secondary/30">
                  <td className="px-5 py-3 font-semibold">{i}</td>
                  <td className="px-5 py-3 text-muted-foreground">{src}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-charcoal p-8 shadow-elegant sm:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-charcoal-foreground sm:text-4xl">
                Got 10 minutes between classes?
              </h2>
              <p className="mt-2 max-w-lg text-charcoal-foreground/75">
                Order now, grab a 4-digit code, skip the canteen queue. Eat well, get back to the grind.
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
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
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
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
        {items.map((item) => (
          <article
            key={item.id}
            className={`group relative flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant ${
              !item.in_stock ? "opacity-60" : ""
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-gradient-warm">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={`h-full w-full object-cover transition-smooth group-hover:scale-105 ${!item.in_stock ? "grayscale" : ""}`}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">🍽️</div>
              )}
              {showNew && (
                <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
                  New
                </span>
              )}
              {!showNew && item.in_stock && (
                <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-soft">
                  Top pick
                </span>
              )}
              {!item.in_stock && (
                <span className="absolute inset-0 flex items-center justify-center bg-charcoal/40 text-xs font-bold uppercase tracking-widest text-charcoal-foreground">
                  Sold out
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-base font-bold">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-xl font-extrabold">₹{Number(item.price).toFixed(0)}</span>
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
