import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Category = { id: string; name: string; sort_order: number };
type Item = { id: string; name: string; description: string | null; price: number; image_url: string | null; in_stock: boolean; category_id: string | null };

export const Route = createFileRoute("/_customer/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? []));
    supabase.from("menu_items").select("id,name,description,price,image_url,in_stock,category_id").then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Explore the menu</h1>
      <p className="mt-2 text-muted-foreground">Everything we make, fresh today.</p>

      <div className="mt-10 space-y-12">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          if (catItems.length === 0) return null;
          return (
            <section key={cat.id}>
              <h2 className="mb-4 font-display text-2xl font-semibold">{cat.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <article
                    key={item.id}
                    className={`flex overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-smooth hover:shadow-elegant ${!item.in_stock ? "opacity-50" : ""}`}
                  >
                    <div className="h-32 w-32 shrink-0 bg-gradient-warm">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-display text-base font-semibold">{item.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
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
                          {item.in_stock ? "Add" : "Out"}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
