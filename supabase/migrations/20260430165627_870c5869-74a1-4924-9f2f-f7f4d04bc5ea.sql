
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS emoji text;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS prep_time_minutes integer;
