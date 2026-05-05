import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "verde-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Sweep: drop any cart item that has been soft-deleted from the menu.
  // Runs on mount, whenever the cart changes, and on realtime menu updates.
  useEffect(() => {
    let cancelled = false;
    const sweep = async () => {
      const ids = items.map((i) => i.id);
      if (ids.length === 0) return;
      const { data } = await supabase
        .from("menu_items")
        .select("id, deleted_at")
        .in("id", ids);
      if (cancelled || !data) return;
      const removed = new Set(
        data.filter((m) => m.deleted_at != null).map((m) => m.id as string),
      );
      // Items missing from the response (hard-deleted) are also unavailable.
      const present = new Set(data.map((m) => m.id as string));
      const toDrop = new Set<string>(removed);
      for (const id of ids) if (!present.has(id)) toDrop.add(id);
      if (toDrop.size > 0) {
        setItems((prev) => prev.filter((i) => !toDrop.has(i.id)));
      }
    };
    sweep();
    const ch = supabase
      .channel("cart-menu-watch")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items" },
        (payload) => {
          const row = payload.new as { id: string; deleted_at: string | null };
          if (row?.deleted_at) {
            setItems((prev) => prev.filter((i) => i.id !== row.id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "menu_items" },
        (payload) => {
          const row = payload.old as { id: string };
          if (row?.id) setItems((prev) => prev.filter((i) => i.id !== row.id));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const addItem: CartContextValue["addItem"] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateQty = (id: string, qty: number) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
