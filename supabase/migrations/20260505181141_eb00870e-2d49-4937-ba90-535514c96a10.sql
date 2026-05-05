-- Soft-delete support for menu_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_menu_items_deleted_at ON public.menu_items (deleted_at);

-- Make order_items.menu_item_id stable: when a menu item is hard-deleted in the future,
-- keep the historical reference intact (we now soft-delete, so this is a safety net).
-- No FK exists, so nothing to alter there.