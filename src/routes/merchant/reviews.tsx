import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

export const Route = createFileRoute("/merchant/reviews")({
  component: ReviewsPage,
});

type Review = { id: string; food_rating: number; service_rating: number; suggestion: string | null; created_at: string; order_id: string };

function Stars({ n }: { n: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}

function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setReviews((data as Review[]) ?? []));
  }, []);

  const avg = (k: "food_rating" | "service_rating") =>
    reviews.length ? (reviews.reduce((s, r) => s + r[k], 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Customer feedback — most recent first.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total reviews" value={String(reviews.length)} />
        <Stat label="Avg food rating" value={avg("food_rating")} />
        <Stat label="Avg service rating" value={avg("service_rating")} />
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground">Food</div><Stars n={r.food_rating} /></div>
              <div><div className="text-xs text-muted-foreground">Service</div><Stars n={r.service_rating} /></div>
              <div className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            {r.suggestion && <p className="mt-3 text-sm italic text-muted-foreground">"{r.suggestion}"</p>}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold text-primary">{value}</div>
    </div>
  );
}
