import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, Tag, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/merchant/menu")({
  component: MenuPage,
});

type Category = { id: string; name: string; sort_order: number; emoji: string | null };
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

// Curated emoji set sellers can pick from when creating a category
const CATEGORY_EMOJIS = [
  "🍔",
  "🍕",
  "🍝",
  "🥗",
  "🍲",
  "🍳",
  "🥤",
  "🍰",
  "🍛",
  "🍟",
  "🐟",
  "🍗",
  "🌮",
  "🍱",
  "🍜",
  "🥘",
  "🥪",
  "🍦",
  "🍪",
  "☕",
  "🥞",
  "🧁",
  "🍩",
  "🥟",
  "🍿",
  "🥙",
  "🍤",
  "🍣",
  "🥩",
  "🌯",
];

function MenuPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [catDialog, setCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState<string>(CATEGORY_EMOJIS[0]);
  const [editingCatEmoji, setEditingCatEmoji] = useState<{
    id: string;
    name: string;
    emoji: string;
  } | null>(null);

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").is("deleted_at", null).order("name"),
    ]);
    setCategories((c.data as Category[]) ?? []);
    setItems((i.data as Item[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStock = async (item: Item) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ in_stock: !item.in_stock })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${item.name} ${!item.in_stock ? "in stock" : "out of stock"}`);
      load();
    }
  };

  const saveItem = async () => {
    if (!editing) return;
    if (!editing.name || editing.price == null) {
      toast.error("Name and price are required");
      return;
    }
    if (!editing.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (
      editing.prep_time_minutes == null ||
      Number.isNaN(Number(editing.prep_time_minutes)) ||
      Number(editing.prep_time_minutes) < 0
    ) {
      toast.error("Please enter a valid preparation time");
      return;
    }
    const ingredients =
      Array.isArray(editing.ingredients)
        ? editing.ingredients
        : typeof editing.ingredients === "string"
          ? (editing.ingredients as string).split(",").map((s) => s.trim()).filter(Boolean)
          : null;
    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      price: Number(editing.price),
      image_url: editing.image_url ?? null,
      category_id: editing.category_id,
      in_stock: editing.in_stock ?? true,
      prep_time_minutes: Number(editing.prep_time_minutes),
      ingredients: ingredients && ingredients.length > 0 ? ingredients : null,
    };
    const { error } = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item? Past orders will keep showing it, and it will be removed from active customer carts.")) return;
    // Soft-delete: preserve historical orders, dashboards and cook mode views.
    const { error } = await supabase
      .from("menu_items")
      .update({ deleted_at: new Date().toISOString(), in_stock: false })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const uploadImage = async (file: File) => {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage
      .from("menu-items")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("menu-items").getPublicUrl(path);
    return data.publicUrl;
  };

  const addCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Enter a category name");
      return;
    }
    if (!newCatEmoji) {
      toast.error("Pick an emoji");
      return;
    }
    const sort_order = categories.length + 1;
    const { error } = await supabase
      .from("categories")
      .insert({ name: newCatName.trim(), emoji: newCatEmoji, sort_order });
    if (error) toast.error(error.message);
    else {
      toast.success("Category added");
      setNewCatName("");
      setNewCatEmoji(CATEGORY_EMOJIS[0]);
      load();
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category? Items in it will be hidden until reassigned.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const updateCategoryEmoji = async () => {
    if (!editingCatEmoji) return;
    const { error } = await supabase
      .from("categories")
      .update({ emoji: editingCatEmoji.emoji })
      .eq("id", editingCatEmoji.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Category emoji updated");
    setEditingCatEmoji(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Menu</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage categories, items, and stock." : "Toggle item availability."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="soft" onClick={() => setCatDialog(true)}>
              <Tag className="mr-1 h-4 w-4" />
              Categories
            </Button>
            <Button
              variant="hero"
              onClick={() => setEditing({ in_stock: true, price: 0, prep_time_minutes: 10 })}
            >
              <Plus className="mr-1 h-4 w-4" />
              New item
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          return (
            <section key={cat.id}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
                {cat.emoji && <span className="text-2xl">{cat.emoji}</span>}
                {cat.name}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onToggle={() => toggleStock(item)}
                    onEdit={() => setEditing(item)}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
                {catItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items.</p>
                )}
              </div>
            </section>
          );
        })}
        {(() => {
          const uncat = items.filter((i) => !i.category_id);
          if (uncat.length === 0) return null;
          return (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-warning-foreground">
                Needs a category
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Edit each item and assign a category — uncategorized items are no longer allowed.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {uncat.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onToggle={() => toggleStock(item)}
                    onEdit={() => setEditing(item)}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
              </div>
            </section>
          );
        })()}
      </div>

      {/* Item dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit item" : "New item"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editing.category_id ?? ""}
                    onValueChange={(v) => setEditing({ ...editing, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No categories yet — create one first.
                        </div>
                      )}
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.emoji ? `${c.emoji}  ${c.name}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Preparation time (minutes) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  placeholder="e.g. 10"
                  value={editing.prep_time_minutes ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      prep_time_minutes: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ingredients (comma-separated)</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. paneer, romaine, quinoa, lemon"
                  value={
                    Array.isArray(editing.ingredients)
                      ? editing.ingredients.join(", ")
                      : (editing.ingredients as unknown as string) ?? ""
                  }
                  onChange={(e) =>
                    setEditing({ ...editing, ingredients: e.target.value as unknown as string[] })
                  }
                />
              </div>
              <div className="space-y-2">
                {editing.image_url && (
                  <img
                    src={editing.image_url}
                    alt=""
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                )}
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary">
                  <Upload className="h-4 w-4" /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadImage(f);
                      if (url) setEditing({ ...editing, image_url: url });
                    }}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.in_stock ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, in_stock: v })}
                />
                <Label>In stock</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={saveItem}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  {c.emoji && <span className="text-xl">{c.emoji}</span>}
                  {c.name}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingCatEmoji({
                        id: c.id,
                        name: c.name,
                        emoji: c.emoji ?? CATEGORY_EMOJIS[0],
                      })
                    }
                  >
                    Edit emoji
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-sm text-muted-foreground">No categories yet.</li>
            )}
          </ul>

          <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                New category
              </Label>
              <Input
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Pick an emoji
              </Label>
              <div className="grid grid-cols-10 gap-1">
                {CATEGORY_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewCatEmoji(em)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-xl transition-smooth ${
                      newCatEmoji === em
                        ? "bg-primary/15 ring-2 ring-primary"
                        : "bg-background hover:bg-secondary"
                    }`}
                    aria-label={`Choose ${em}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="hero" className="w-full" onClick={addCategory}>
              <Plus className="mr-1 h-4 w-4" />
              Add category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCatEmoji} onOpenChange={(open) => !open && setEditingCatEmoji(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit emoji for {editingCatEmoji?.name}</DialogTitle>
          </DialogHeader>
          {editingCatEmoji && (
            <div className="grid grid-cols-10 gap-1">
              {CATEGORY_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEditingCatEmoji({ ...editingCatEmoji, emoji: em })}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-xl transition-smooth ${
                    editingCatEmoji.emoji === em
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "bg-background hover:bg-secondary"
                  }`}
                  aria-label={`Choose ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingCatEmoji(null)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={updateCategoryEmoji}>
              Save emoji
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemCard({
  item,
  isAdmin,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: Item;
  isAdmin: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-soft ${!item.in_stock ? "opacity-60" : ""}`}
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-warm">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <h3 className="font-medium">{item.name}</h3>
          <span className="font-semibold text-primary">₹{Number(item.price).toFixed(0)}</span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        {item.prep_time_minutes != null && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {item.prep_time_minutes} min prep
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={item.in_stock} onCheckedChange={onToggle} />
            <span className="text-muted-foreground">{item.in_stock ? "In stock" : "Out"}</span>
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
