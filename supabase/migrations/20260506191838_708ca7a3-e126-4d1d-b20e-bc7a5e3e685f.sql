-- Allow short_code to be null (so completed orders can release it)
ALTER TABLE public.orders ALTER COLUMN short_code DROP NOT NULL;

-- Replace generator: pick a 4-digit code that no active (pending/ready) order currently holds
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.orders
      WHERE short_code = candidate
        AND status IN ('pending', 'ready')
    );
    attempts := attempts + 1;
    IF attempts > 50 THEN
      -- Fallback: just return candidate even if collision (extremely unlikely)
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$function$;

-- Trigger: when an order transitions to completed, release its 4-digit code
CREATE OR REPLACE FUNCTION public.release_short_code_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.short_code := NULL;
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_release_short_code_on_complete ON public.orders;
CREATE TRIGGER trg_release_short_code_on_complete
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.release_short_code_on_complete();

-- Ensure the assign-short-code trigger exists for new orders
DROP TRIGGER IF EXISTS trg_set_order_short_code ON public.orders;
CREATE TRIGGER trg_set_order_short_code
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_short_code();

-- Clear codes on existing completed orders so their codes return to the pool
UPDATE public.orders SET short_code = NULL WHERE status = 'completed' AND short_code IS NOT NULL;