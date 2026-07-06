-- ==============================================================================
-- PADRAO PAVER NO TALENTS (2026-07-06) — 5/5
-- Login sem acesso NAO cria papel automatico. A versao anterior inseria 'viewer'
-- para qualquer novo login (funcao hoje orfa — sem trigger — mas redefinida por
-- seguranca caso volte a ser ligada a um trigger em auth.users).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.talents_sync_user_role_on_login()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_name  TEXT;
  user_photo TEXT;
  existing_role RECORD;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NULL
  );
  user_photo := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  SELECT * INTO existing_role
  FROM public.talents_user_roles
  WHERE lower(trim(email)) = lower(trim(user_email))
  LIMIT 1;

  -- Apenas sincroniza quem JA tem papel; nunca cria viewer automatico.
  IF existing_role IS NOT NULL THEN
    UPDATE public.talents_user_roles
    SET
      user_id    = NEW.id,
      name       = COALESCE(user_name, existing_role.name),
      photo      = COALESCE(user_photo, existing_role.photo),
      last_login = NOW(),
      updated_at = NOW()
    WHERE id = existing_role.id;
  END IF;

  RETURN NEW;
END;
$$;
