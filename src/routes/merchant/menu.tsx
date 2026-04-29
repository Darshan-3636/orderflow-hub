import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/merchant/menu")({
  component: MenuPage,
});

type Category = { id: string; name: string; sort_order: number };
type Item = {
  id: string; name: string; description: string | null; price: number;
  image_url: string | null; in_stock: boolean; category_id: string | null;
};

function MenuPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [catDialog, setCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("name"),
    ]);
    setCategories((c.data as Category[]) ?? []);
    setItems((i.data as Item[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStock = async (item: Item) => {
    const { error } = await supabase.from("menu_items").update({ in_stock: !item.in_stock }).eq("id", item.id);
    if (error) toast.error(error.message);
    else { toast.success(`${item.name} ${!item.in_stock ? "in stock" : "out of stock"}`); load(); }
  };

  const saveItem = async () => {
    if (!editing) return;
    if (!editing.name || editing.price == null) { toast.error("Name and price are required"); return; }
    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      price: Number(editing.price),
      image_url: editing.image_url ?? null,
      category_id: editing.category_id ?? null,
      in_stock: editing.in_stock ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const uploadImage = async (file: File) => {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("menu-items").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("menu-items").getPublicUrl(path);
    return data.publicUrl;
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const sort_order = categories.length + 1;
    const { error } = await supabase.from("categories").insert({ name: newCatName.trim(), sort_order });
    if (error) toast.error(error.message);
    else { toast.success("Category added"); setNewCatName(""); setCatDialog(false); load(); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category? Items in it will become uncategorized.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Menu</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage categories, items, and stock." : "Toggle item availability."}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="soft" onClick={() => setCatDialog(true)}><Tag className="mr-1 h-4 w-4" />Categories</Button>
            <Button variant="hero" onClick={() => setEditing({ in_stock: true, price: 0 })}>
              <Plus className="mr-1 h-4 w-4" />New item
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          return (
            <section key={cat.id}>
              <h2 className="mb-3 font-display text-xl font-semibold">{cat.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <ItemCard key={item.id} item={item} isAdmin={isAdmin} onToggle={() => toggleStock(item)} onEdit={() => setEditing(item)} onDelete={() => deleteItem(item.id)} />
                ))}
                {catItems.length === 0 && <p className="text-sm text-muted-foreground">No items.</p>}
              </div>
            </section>
          );
        })}
        {(() => {
          const uncat = items.filter((i) => !i.category_id);
          if (uncat.length === 0) return null;
          return (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">Uncategorized</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {uncat.map((item) => (
                  <ItemCard key={item.id} item={item} isAdmin={isAdmin} onToggle={() => toggleStock(item)} onEdit={() => setEditing(item)} onDelete={() => deleteItem(item.id)} />
                ))}
              </div>
            </section>
          );
        })()}
      </div>

      {/* Item dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit item" : "New item"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Name</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" min={0} step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editing.category_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                {editing.image_url && <img src={editing.image_url} alt="" className="h-24 w-24 rounded-lg object-cover" />}
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const url = await uploadImage(f); if (url) setEditing({ ...editing, image_url: url });
                  }} />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.in_stock ?? true} onCheckedChange={(v) => setEditing({ ...editing, in_stock: v })} />
                <Label>In stock</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="hero" onClick={saveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Categories</DialogTitle></DialogHeader>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2">
                <span>{c.name}</span>
                <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input placeholder="New category" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <Button variant="hero" onClick={addCategory}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemCard({ item, isAdmin, onToggle, onEdit, onDelete }: { item: Item; isAdmin: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-soft ${!item.in_stock ? "opacity-60" : ""}`}>
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-warm">
        {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🍽️</div>}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <h3 className="font-medium">{item.name}</h3>
          <span className="font-semibold text-primary">₹{Number(item.price).toFixed(0)}</span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={item.in_stock} onCheckedChange={onToggle} />
            <span className="text-muted-foreground">{item.in_stock ? "In stock" : "Out"}</span>
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
