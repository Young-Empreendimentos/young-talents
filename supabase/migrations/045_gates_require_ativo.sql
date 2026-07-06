-- ==============================================================================
-- PADRAO PAVER NO TALENTS (2026-07-06) — 4/5
-- Endurecimento: as funcoes de gate passam a exigir ativo=true.
-- Dev (talents_is_developer) continua com bypass. Usuario desativado perde
-- leitura/escrita ja no RLS (as policies existentes chamam estas funcoes).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.talents_has_staff_access()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  jwt_email TEXT;
BEGIN
  IF public.talents_is_developer() THEN
    RETURN TRUE;
  END IF;

  jwt_email := LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')));

  RETURN EXISTS (
    SELECT 1 FROM public.talents_user_roles ur
    WHERE ur.role IN ('admin', 'editor', 'viewer')
      AND COALESCE(ur.ativo, true)
      AND (
        ur.user_id = auth.uid()
        OR (
          ur.user_id IS NULL
          AND jwt_email IS NOT NULL
          AND LOWER(TRIM(ur.email)) = jwt_email
        )
      )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.talents_has_privileged_role(p_min_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.talents_user_roles ur
    WHERE
      (
        (p_min_role = 'admin' AND ur.role = 'admin')
        OR (p_min_role = 'editor' AND ur.role IN ('admin', 'editor'))
      )
      AND COALESCE(ur.ativo, true)
      AND (
        ur.user_id = auth.uid()
        OR (
          (auth.jwt() ->> 'email') IS NOT NULL
          AND lower(trim(ur.email)) = lower(trim(auth.jwt() ->> 'email'))
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.talents_is_editor_or_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  jwt_email TEXT;
BEGIN
  jwt_email := LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')));
  RETURN EXISTS (
    SELECT 1 FROM public.talents_user_roles ur
    WHERE ur.role IN ('admin', 'editor')
      AND COALESCE(ur.ativo, true)
      AND (
        ur.user_id = auth.uid()
        OR (ur.user_id IS NULL AND jwt_email IS NOT NULL AND LOWER(TRIM(ur.email)) = jwt_email)
      )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.talents_is_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.talents_user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND COALESCE(ativo, true)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
