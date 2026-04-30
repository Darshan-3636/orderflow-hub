import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, ArrowRight, Leaf, Clock, BookOpen, Brain, MapPin, Salad, Sprout, Sun } from "lucide-react";
import { toast } from "sonner";
import heroBowl from "@/assets/hero-fresh-bowl.jpg";

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
      {/* Hero — light, airy, centered */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pt-8 sm:px-10 sm:pt-12">
        <div className="relative grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sprout className="h-3.5 w-3.5" /> Honest. Fresh. Daily.
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Eat fresh.<br />
              <span className="text-primary">Think sharper.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              A farm-to-campus kitchen tucked inside the MSRIT canteen — built around
              the simple idea that better ingredients make better minds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="default" size="xl">
                <Link to="/explore">Order now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/orders">My orders</Link>
              </Button>
            </div>
            <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-6">
              <Stat value="2k+" label="MSRITians fed" />
              <Stat value="100%" label="Sourced daily" />
              <Stat value="~12m" label="Order to plate" />
            </div>
          </div>

          {/* Hero image — clean, no overlay */}
          <div className="relative mx-auto w-full max-w-xl md:max-w-none">
            <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative aspect-square overflow-hidden rounded-full border border-border/60 bg-secondary/40 shadow-elegant">
              <img
                src={heroBowl}
                alt="Fresh greens, paneer and quinoa bowl"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -left-2 top-6 flex items-center gap-2 rounded-full border border-border/60 bg-background px-3.5 py-2 text-xs font-bold shadow-soft sm:left-0">
              <Leaf className="h-3.5 w-3.5 text-primary" /> Sourced today
            </div>
            <div className="absolute -right-2 bottom-10 flex items-center gap-2 rounded-full border border-border/60 bg-background px-3.5 py-2 text-xs font-bold shadow-soft sm:right-0">
              <Clock className="h-3.5 w-3.5 text-primary" /> Ready in 12 min
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-14 sm:px-10 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={<Salad className="h-5 w-5" />} title="Crisp, never tired" desc="Greens and vegetables arrive each morning — washed, prepped, plated within hours." />
          <Feature icon={<Sun className="h-5 w-5" />} title="Pure prep" desc="No reheats, no heavy oils, no shortcuts. Just real food cooked to order." />
          <Feature icon={<Brain className="h-5 w-5" />} title="Brain fuel" desc="Lean proteins and complex carbs that keep focus steady through the longest lectures." />
        </div>
      </section>

      {/* Essence of Freshness */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sprout className="h-3.5 w-3.5" /> The essence of freshness
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            From the soil. To the plate. Same day.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every morning before the first lecture begins, our suppliers arrive with
            the day's harvest — leafy greens still cool from the field, vegetables
            chosen for their crunch, dairy delivered straight from the dairy. We don't
            stock for the week. We stock for the day.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
          <Pillar
            number="01"
            title="Sourced at sunrise"
            desc="Hand-picked produce from KR Market, Hopcoms and partner farms — on the counter before 7 AM."
          />
          <Pillar
            number="02"
            title="Prepped clean"
            desc="No frozen shortcuts, no preservatives, no heavy seed oils. Just rinse, chop, cook, serve."
          />
          <Pillar
            number="03"
            title="Plated for focus"
            desc="Balanced protein, fibre and slow carbs — designed to fuel hours of study, not a 3 PM crash."
          />
        </div>
      </section>

      {/* Campus Connection */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 sm:px-10">
        <div className="rounded-[2rem] bg-gradient-warm p-8 shadow-soft sm:p-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <MapPin className="h-3.5 w-3.5" /> The campus connection
            </span>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              The pitstop in the middle of your day.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              We sit right in the heart of the MSRIT canteen — the natural meeting point
              between the Apex Block, LHC, DES, ESB and the Multipurpose Block. Whichever
              direction your day pulls you, we're a short walk away.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { name: "Apex", mins: "2 min" },
              { name: "LHC", mins: "3 min" },
              { name: "DES", mins: "4 min" },
              { name: "ESB", mins: "5 min" },
              { name: "Multipurpose", mins: "3 min" },
            ].map((b) => (
              <div key={b.name} className="rounded-2xl border border-border/60 bg-background p-5 text-center shadow-soft">
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
      <section className="mx-auto w-full max-w-[1600px] px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Leaf className="h-3.5 w-3.5" /> Ingredient transparency
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Know what's on your plate.
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Every ingredient. Every morning. Traceable to its source.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left">
                <th className="px-5 py-4 font-display font-bold">Ingredient</th>
                <th className="px-5 py-4 font-display font-bold">Sourced from</th>
                <th className="hidden px-5 py-4 font-display font-bold sm:table-cell">Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                ["Leafy greens & herbs", "KR Market, Bengaluru", "Daily, 6 AM"],
                ["Tomatoes & vegetables", "Hopcoms, Yelahanka", "Daily"],
                ["Paneer & dairy", "Nandini, Karnataka", "Twice daily"],
                ["Eggs & poultry", "Local farm, Doddaballapur", "Every morning"],
                ["Cold-pressed oils", "Sahyadri Farms", "Weekly"],
                ["Rice & grains", "Mandya direct trade", "Weekly"],
              ].map(([i, src, freq]) => (
                <tr key={i} className="transition-smooth hover:bg-secondary/30">
                  <td className="px-5 py-4 font-semibold">{i}</td>
                  <td className="px-5 py-4 text-muted-foreground">{src}</td>
                  <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">{freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 sm:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-mint p-10 text-center shadow-soft sm:p-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Got 10 minutes between classes?
            </h2>
            <p className="mt-4 text-base text-foreground/70 sm:text-lg">
              Order ahead, grab a 4-digit code, skip the queue. Eat well — get back to the grind.
            </p>
            <div className="mt-7 flex justify-center">
              <Button asChild size="xl" variant="default">
                <Link to="/explore">Start an order <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Pillar({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-7 shadow-soft">
      <div className="font-display text-sm font-bold tracking-widest text-primary">{number}</div>
      <h3 className="mt-3 font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
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
    <section className="mx-auto w-full max-w-[1600px] px-6 py-12 sm:px-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </span>
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link to="/explore" className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex">
          View all →
        </Link>
      </div>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
        {items.map((item) => (
          <article
            key={item.id}
            className={`group relative flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant ${
              !item.in_stock ? "opacity-60" : ""
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary/40">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={`h-full w-full object-cover transition-smooth group-hover:scale-105 ${!item.in_stock ? "grayscale" : ""}`}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">🥗</div>
              )}
              {showNew && (
                <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
                  New
                </span>
              )}
              {!showNew && item.in_stock && (
                <span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-soft backdrop-blur">
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
                  variant="default"
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
