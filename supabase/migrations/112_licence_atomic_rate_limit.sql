-- Le comptage et l'insertion d'une tentative forment une opération atomique :
-- deux requêtes simultanées d'une même IP ne peuvent pas dépasser la limite.
CREATE FUNCTION public.try_consume_licence_application_slot(p_ip_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_identifier text := 'licence:' || left(coalesce(p_ip_hash, 'unknown'), 64);
  v_recent_attempts bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(v_identifier, 0));

  SELECT count(*)
    INTO v_recent_attempts
    FROM public.login_attempts
   WHERE identifier = v_identifier
     AND attempt_type = 'licence'
     AND attempted_at >= now() - interval '1 hour';

  IF v_recent_attempts >= 5 THEN
    RETURN false;
  END IF;

  INSERT INTO public.login_attempts (identifier, attempt_type, success)
  VALUES (v_identifier, 'licence', true);

  RETURN true;
END;
$function$;

-- Les nouvelles fonctions reçoivent encore des privilèges implicites sur
-- cette base; révoquer explicitement anon/authenticated et PUBLIC est requis.
REVOKE ALL ON FUNCTION public.try_consume_licence_application_slot(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_consume_licence_application_slot(text)
  TO service_role;
