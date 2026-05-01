
-- Make order_id nullable on reviews to allow standalone service feedback
ALTER TABLE public.reviews ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_order_id_key;
-- Recreate uniqueness only when order_id is provided
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_id_unique ON public.reviews(order_id) WHERE order_id IS NOT NULL;
-- food_rating optional now (general feedback may have only service rating)
ALTER TABLE public.reviews ALTER COLUMN food_rating DROP NOT NULL;

-- Per-item review ratings
CREATE TABLE IF NOT EXISTS public.review_item_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  menu_item_id UUID,
  item_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.review_item_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads item ratings"
  ON public.review_item_ratings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owner inserts item ratings"
  ON public.review_item_ratings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  ));
