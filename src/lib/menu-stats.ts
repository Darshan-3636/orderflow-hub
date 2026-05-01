import { supabase } from "@/integrations/supabase/client";

export type ItemRatingStat = { avg: number; count: number };

/**
 * Fetch average review rating + count for a set of menu item IDs.
 * Uses the `review_item_ratings` table (per-item star ratings).
 */
export async function fetchItemRatings(
  itemIds: string[],
): Promise<Record<string, ItemRatingStat>> {
  if (itemIds.length === 0) return {};
  const { data } = await supabase
    .from("review_item_ratings")
    .select("menu_item_id, rating")
    .in("menu_item_id", itemIds);
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of data ?? []) {
    const id = r.menu_item_id as string | null;
    if (!id) continue;
    if (!acc[id]) acc[id] = { sum: 0, count: 0 };
    acc[id].sum += Number(r.rating ?? 0);
    acc[id].count += 1;
  }
  const out: Record<string, ItemRatingStat> = {};
  for (const [id, v] of Object.entries(acc)) {
    out[id] = { avg: v.sum / v.count, count: v.count };
  }
  return out;
}

/**
 * Compute total quantity sold for every menu_item_id, then derive a per-category
 * rank (1 = best seller). Returns rank only when:
 *   - the item has > 0 sales
 *   - the item is in the top 4 of its category
 *   - the category has at least 2 items with sales (otherwise ranking isn't meaningful)
 */
export async function fetchCategoryRanks(
  itemsByCategory: Record<string, string[]>,
): Promise<Record<string, number>> {
  const allIds = Object.values(itemsByCategory).flat();
  if (allIds.length === 0) return {};
  const { data } = await supabase
    .from("order_items")
    .select("menu_item_id, quantity");
  const sold: Record<string, number> = {};
  for (const r of data ?? []) {
    const id = r.menu_item_id as string | null;
    if (!id) continue;
    sold[id] = (sold[id] ?? 0) + Number(r.quantity ?? 0);
  }
  const ranks: Record<string, number> = {};
  for (const [, ids] of Object.entries(itemsByCategory)) {
    const withSales = ids
      .map((id) => ({ id, qty: sold[id] ?? 0 }))
      .filter((x) => x.qty > 0)
      .sort((a, b) => b.qty - a.qty);
    if (withSales.length < 2) continue; // not meaningful
    withSales.slice(0, 4).forEach((x, i) => {
      ranks[x.id] = i + 1;
    });
  }
  return ranks;
}
