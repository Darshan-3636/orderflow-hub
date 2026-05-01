import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, Clock, Leaf, Trophy } from "lucide-react";
import { toast } from "sonner";
import { fetchCategoryRanks, fetchItemRatings } from "@/lib/menu-stats";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  category_id: string | null;
  prep_time_minutes: number | null;
  ingredients: string[] | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  review_id: string;
};

type ParentReview = {
  id: string;
  user_id: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_customer/menu/$itemId")({
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [item, setItem] = useState<Item | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [reviews, setReviews] = useState<(ReviewRow & { author: string | null; parent_created_at: string })[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: it } = await supabase
        .from("menu_items")
        .select("id,name,description,price,image_url,in_stock,category_id,prep_time_minutes,ingredients")
        .eq("id", itemId)
        .maybeSingle();
      if (cancelled) return;
      setItem((it as Item) ?? null);

      if (it?.category_id) {
        const { data: cat } = await supabase
          .from("categories")
          .select("name")
          .eq("id", it.category_id)
          .maybeSingle();
        if (!cancelled) setCategoryName(cat?.name ?? null);

        // siblings for ranking
        const { data: siblings } = await supabase
          .from("menu_items")
          .select("id")
          .eq("category_id", it.category_id);
        const ids = (siblings ?? []).map((s) => s.id as string);
        const ranks = await fetchCategoryRanks({ [it.category_id]: ids });
        if (!cancelled) setRank(ranks[itemId] ?? null);
      }

      // Reviews for this item, joined with parent review for author/created_at
      const { data: rir } = await supabase
        .from("review_item_ratings")
        .select("id, rating, comment, created_at, review_id")
        .eq("menu_item_id", itemId)
        .order("created_at", { ascending: false });
      const parentIds = Array.from(new Set((rir ?? []).map((r) => r.review_id as string)));
      let parents: Record<string, ParentReview> = {};
      if (parentIds.length > 0) {
        const { data: rs } = await supabase
          .from("reviews")
          .select("id, user_id, created_at")
          .in("id", parentIds);
        parents = Object.fromEntries((rs ?? []).map((r) => [r.id, r as ParentReview]));
      }
      const userIds = Array.from(
        new Set(Object.values(parents).map((p) => p.user_id).filter(Boolean) as string[]),
      );
      let names: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? ""]));
      }
      const merged = (rir ?? []).map((r) => {
        const parent = parents[r.review_id as string];
        return {
          ...(r as ReviewRow),
          author: parent?.user_id ? names[parent.user_id] || "Customer" : "Customer",
          parent_created_at: parent?.created_at ?? (r.created_at as string),
        };
      });
      if (!cancelled) setReviews(merged);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const ratingStat = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return { avg: sum / reviews.length, count: reviews.length };
  }, [reviews]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center text-muted-foreground">Loading…</div>
    );
  }
  if (!item) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Item not found.</p>
        <Button variant="hero" className="mt-4" onClick={() => navigate({ to: "/explore" })}>
          Back to menu
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-gradient-warm shadow-elegant">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">🍽️</div>
          )}
          {rank && categoryName && (
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-warning px-3 py-1.5 text-xs font-bold text-warning-foreground shadow-soft">
              <Trophy className="h-3.5 w-3.5" /> #{rank} in {categoryName}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {categoryName && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryName}
            </span>
          )}
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {item.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1.5 text-sm font-semibold">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {ratingStat.count > 0 ? ratingStat.avg.toFixed(1) : "—"}
              <span className="text-muted-foreground">
                ({ratingStat.count} {ratingStat.count === 1 ? "review" : "reviews"})
              </span>
            </div>
            {item.prep_time_minutes != null && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> ~{item.prep_time_minutes} min
              </div>
            )}
          </div>

          <div className="mt-6 font-display text-4xl font-extrabold text-primary">
            ₹{Number(item.price).toFixed(0)}
          </div>

          {item.description && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          {item.ingredients && item.ingredients.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Leaf className="h-4 w-4 text-primary" /> Ingredients
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-sm"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Button
              size="xl"
              variant="hero"
              disabled={!item.in_stock}
              onClick={() => {
                addItem({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url });
                toast.success(`Added ${item.name}`);
              }}
            >
              {item.in_stock ? "Add to cart" : "Sold out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
            No reviews yet — be the first to rate {item.name}.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i <= r.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.parent_created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{r.author ?? "Customer"}</p>
                {r.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
