-- ==============================================================================
-- ROLLBACK do padrao Paver no Talents (migrations 042-046).
-- Restaura o estado do banco vivo capturado em 2026-07-06 antes das mudancas.
-- Rode inteiro numa transacao.
-- ==============================================================================
BEGIN;

-- 1) Remove RPCs de onboarding/aprovacao (044).
DROP FUNCTION IF EXISTS public.talents_registrar_solicitacao_acesso();
DROP FUNCTION IF EXISTS public.talents_aprovar_solicitacao(uuid, text);
DROP FUNCTION IF EXISTS public.talents_recusar_solicitacao(uuid);
DROP FUNCTION IF EXISTS public.talents_authorize_user(text, text);

-- 2) Remove a tabela de solicitacoes (043) — apaga policies junto.
DROP TABLE IF EXISTS public.talents_solicitacao_acesso;

-- 3) Restaura as funcoes de gate SEM a checagem de ativo (estado pre-045).
CREATE OR REPLACE FUNCTION public.talents_has_staff_access()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE jwt_email TEXT;
BEGIN
  IF public.talents_is_developer() THEN RETURN TRUE; END IF;
  jwt_email := LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')));
  RETURN EXISTS (
    SELECT 1 FROM public.talents_user_roles ur
    WHERE ur.role IN ('admin', 'editor', 'viewer')
    AND (
      ur.user_id = auth.uid()
      OR (ur.user_id IS NULL AND jwt_email IS NOT NULL AND LOWER(TRIM(ur.email)) = jwt_email)
    )
  );
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.talents_has_privileged_role(p_min_role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.talents_user_roles ur
    WHERE (
        (p_min_role = 'admin' AND ur.role = 'admin')
        OR (p_min_role = 'editor' AND ur.role IN ('admin', 'editor'))
      )
      AND (
        ur.user_id = auth.uid()
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND lower(trim(ur.email)) = lower(trim(auth.jwt() ->> 'email')))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.talents_is_editor_or_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE jwt_email TEXT;
BEGIN
  jwt_email := LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')));
  RETURN EXISTS (
    SELECT 1 FROM public.talents_user_roles ur
    WHERE ur.role IN ('admin', 'editor')
    AND (
      ur.user_id = auth.uid()
      OR (ur.user_id IS NULL AND jwt_email IS NOT NULL AND LOWER(TRIM(ur.email)) = jwt_email)
    )
  );
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.talents_is_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.talents_user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$;

-- 4) Restaura o sync_user_role_on_login COM viewer automatico (estado pre-046).
CREATE OR REPLACE FUNCTION public.talents_sync_user_role_on_login()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT; user_name TEXT; user_photo TEXT; existing_role RECORD;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', NULL);
  user_photo := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL);
  SELECT * INTO existing_role FROM public.talents_user_roles WHERE lower(trim(email)) = lower(trim(user_email)) LIMIT 1;
  IF existing_role IS NOT NULL THEN
    UPDATE public.talents_user_roles
    SET user_id = NEW.id, name = COALESCE(user_name, existing_role.name), photo = COALESCE(user_photo, existing_role.photo), last_login = NOW(), updated_at = NOW()
    WHERE id = existing_role.id;
  ELSE
    INSERT INTO public.talents_user_roles AS ur (user_id, email, name, photo, role, created_at, last_login)
    VALUES (NEW.id, user_email, user_name, user_photo, 'viewer', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id, name = COALESCE(EXCLUDED.name, ur.name), photo = COALESCE(EXCLUDED.photo, ur.photo), last_login = NOW(), updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 5) Remove a coluna ativo (042). Faca por ultimo (as funcoes acima ja nao a usam).
ALTER TABLE public.talents_user_roles DROP COLUMN IF EXISTS ativo;

COMMIT;
