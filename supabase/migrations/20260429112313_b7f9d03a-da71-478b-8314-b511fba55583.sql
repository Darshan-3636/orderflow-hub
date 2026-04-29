REVOKE EXECUTE ON FUNCTION public.generate_short_code() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
END;
$function$;