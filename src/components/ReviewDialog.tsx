import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ReviewDialog({ open, onOpenChange, orderId }: { open: boolean; onOpenChange: (v: boolean) => void; orderId: string | null }) {
  const { user } = useAuth();
  const [food, setFood] = useState(5);
  const [service, setService] = useState(5);
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !orderId) return;
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      order_id: orderId, user_id: user.id, food_rating: food, service_rating: service, suggestion: suggestion || null,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Thanks for your feedback!"); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>How was your order?</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Food quality</Label><StarRating value={food} onChange={setFood} /></div>
          <div className="space-y-2"><Label>Service</Label><StarRating value={service} onChange={setService} /></div>
          <div className="space-y-2"><Label>Suggestions (optional)</Label><Textarea rows={3} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder="Tell us how we could improve…" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
          <Button variant="hero" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Submit review"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
