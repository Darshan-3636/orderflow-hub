import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ReviewItem = { menu_item_id: string | null; name: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When provided, attaches the review to this order. Omit for general feedback. */
  orderId?: string | null;
  /** Items to rate individually (only when orderId is provided). */
  items?: ReviewItem[];
  /** Override dialog title/description for general feedback flows. */
  title?: string;
  description?: string;
};

export function ReviewDialog({ open, onOpenChange, orderId, items, title, description }: Props) {
  const { user } = useAuth();
  const [service, setService] = useState(5);
  const [suggestion, setSuggestion] = useState("");
  const [itemRatings, setItemRatings] = useState<Record<string, { rating: number; comment: string }>>({});
  const [busy, setBusy] = useState(false);

  // reset state when reopened
  useEffect(() => {
    if (open) {
      setService(5);
      setSuggestion("");
      const init: Record<string, { rating: number; comment: string }> = {};
      (items ?? []).forEach((it, idx) => {
        init[`${it.menu_item_id ?? "x"}-${idx}`] = { rating: 5, comment: "" };
      });
      setItemRatings(init);
    }
  }, [open, items]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);

    // Average the per-item ratings into the legacy food_rating column when present
    const ratings = Object.values(itemRatings);
    const avgFood = ratings.length
      ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length)
      : null;

    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert({
        order_id: orderId ?? null,
        user_id: user.id,
        food_rating: avgFood,
        service_rating: service,
        suggestion: suggestion || null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setBusy(false);
      toast.error(error?.message ?? "Could not submit");
      return;
    }

    // Insert per-item ratings if any
    if (items && items.length) {
      const rows = items.map((it, idx) => {
        const key = `${it.menu_item_id ?? "x"}-${idx}`;
        const r = itemRatings[key] ?? { rating: 5, comment: "" };
        return {
          review_id: inserted.id,
          menu_item_id: it.menu_item_id,
          item_name: it.name,
          rating: r.rating,
          comment: r.comment || null,
        };
      });
      const { error: itemErr } = await supabase.from("review_item_ratings").insert(rows);
      if (itemErr) {
        setBusy(false);
        toast.error(itemErr.message);
        return;
      }
    }

    setBusy(false);
    toast.success("Thanks for your feedback!");
    onOpenChange(false);
  };

  const isGeneral = !orderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title ?? (isGeneral ? "Share your feedback" : "How was your order?")}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-5">
          {items && items.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Rate each item</Label>
              {items.map((it, idx) => {
                const key = `${it.menu_item_id ?? "x"}-${idx}`;
                const r = itemRatings[key] ?? { rating: 5, comment: "" };
                return (
                  <div key={key} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{it.name}</span>
                      <StarRating
                        value={r.rating}
                        onChange={(n) => setItemRatings((p) => ({ ...p, [key]: { ...r, rating: n } }))}
                        size={22}
                      />
                    </div>
                    <Textarea
                      rows={2}
                      className="mt-2"
                      placeholder="Optional comment about this item…"
                      value={r.comment}
                      onChange={(e) => setItemRatings((p) => ({ ...p, [key]: { ...r, comment: e.target.value } }))}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-2">
            <Label>{isGeneral ? "How is our service?" : "Service rating"}</Label>
            <StarRating value={service} onChange={setService} />
          </div>
          <div className="space-y-2">
            <Label>{isGeneral ? "Tell us more (optional)" : "Suggestions (optional)"}</Label>
            <Textarea
              rows={3}
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Tell us how we could improve…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
