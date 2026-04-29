CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.generate_short_code() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.set_order_short_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    NEW.short_code := public.generate_short_code();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_order_short_code ON public.orders;
CREATE TRIGGER trg_set_order_short_code
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_short_code();