import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_customer/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, removeItem, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const placeOrder = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (items.length === 0) return;
    setPlacing(true);
    // Pull customer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: profile?.full_name ?? user.email ?? "Customer",
        customer_phone: profile?.phone ?? "",
        subtotal, tax, total,
        status: "pending",
        payment_status: "paid",
        short_code: "",
      })
      .select("id, short_code")
      .single();

    if (error || !order) {
      setPlacing(false);
      toast.error(error?.message ?? "Could not place order");
      return;
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }))
    );
    setPlacing(false);
    if (itemsErr) {
      toast.error(itemsErr.message);
      return;
    }
    clear();
    toast.success(`Order placed! Pickup code: ${order.short_code}`);
    navigate({ to: "/orders" });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse the menu and add something delicious.</p>
        <Button variant="hero" className="mt-6" onClick={() => navigate({ to: "/explore" })}>Explore menu</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Your cart</h1>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border/60 bg-card shadow-soft">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-warm">
              {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🍽️</div>}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{i.name}</h3>
              <p className="text-sm text-muted-foreground">₹{i.price.toFixed(0)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => updateQty(i.id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
              <span className="w-6 text-center text-sm font-medium">{i.quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => updateQty(i.id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>₹{tax.toFixed(0)}</span></div>
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between font-display text-lg font-semibold"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
        </div>
        <Button variant="hero" size="lg" className="mt-6 w-full" onClick={placeOrder} disabled={placing}>
          {placing ? "Placing order…" : user ? "Place order (pay on pickup)" : "Sign in to checkout"}
        </Button>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
    </div>
  );
}
