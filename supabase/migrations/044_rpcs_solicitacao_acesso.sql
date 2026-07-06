-- ==============================================================================
-- PADRAO PAVER NO TALENTS (2026-07-06) — 3/5
-- RPCs de onboarding/aprovacao. Talents casa papel por EMAIL (unique) OU user_id;
-- papeis: admin/editor/viewer.
-- ==============================================================================

-- 1) Chamada no login: registra/reabre pedido se o usuario nao tem acesso ATIVO.
CREATE OR REPLACE FUNCTION public.talents_registrar_solicitacao_acesso()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_jwt_email  text;
  v_email      text;
  v_name       text;
  v_has_active boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  v_jwt_email := lower(trim(nullif(auth.jwt() ->> 'email', '')));

  -- Tem papel (admin/editor/viewer) por user_id OU email, E ativo=true?
  SELECT EXISTS (
    SELECT 1 FROM public.talents_user_roles ur
    WHERE ur.role IN ('admin','editor','viewer')
      AND COALESCE(ur.ativo, true)
      AND (
        ur.user_id = v_uid
        OR (v_jwt_email IS NOT NULL AND lower(trim(ur.email)) = v_jwt_email)
      )
  ) INTO v_has_active;

  IF v_has_active THEN RETURN; END IF;

  SELECT au.email::text,
         COALESCE(
           NULLIF(au.raw_user_meta_data->>'full_name', ''),
           NULLIF(au.raw_user_meta_data->>'name', ''),
           split_part(au.email, '@', 1)
         )
    INTO v_email, v_name
  FROM auth.users au WHERE au.id = v_uid;

  INSERT INTO public.talents_solicitacao_acesso (user_id, email, full_name, status)
  VALUES (v_uid, v_email, v_name, 'pending')
  ON CONFLICT (user_id) DO UPDATE
    SET status       = 'pending',
        requested_at = now(),
        email        = EXCLUDED.email,
        full_name    = EXCLUDED.full_name,
        decided_at   = NULL,
        decided_by   = NULL
    WHERE public.talents_solicitacao_acesso.status <> 'rejected';
END;
$$;
GRANT EXECUTE ON FUNCTION public.talents_registrar_solicitacao_acesso() TO authenticated;

-- 2) Admin aprova: grava papel + ativo=true e marca a solicitacao como approved.
CREATE OR REPLACE FUNCTION public.talents_aprovar_solicitacao(p_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_name    text;
BEGIN
  IF NOT (public.talents_is_developer() OR public.talents_has_privileged_role('admin')) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar solicitacoes.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role NOT IN ('admin','editor','viewer') THEN
    RAISE EXCEPTION 'Perfil invalido: %', p_role;
  END IF;

  SELECT user_id, email, full_name INTO v_user_id, v_email, v_name
  FROM public.talents_solicitacao_acesso WHERE id = p_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Solicitacao nao encontrada.';
  END IF;

  IF v_email IS NULL THEN
    SELECT au.email::text INTO v_email FROM auth.users au WHERE au.id = v_user_id;
  END IF;

  INSERT INTO public.talents_user_roles (user_id, email, name, role, ativo, created_at, last_login)
  VALUES (v_user_id, lower(trim(v_email)), v_name, p_role, true, now(), now())
  ON CONFLICT (email) DO UPDATE
    SET user_id    = EXCLUDED.user_id,
        role       = EXCLUDED.role,
        ativo      = true,
        name       = COALESCE(public.talents_user_roles.name, EXCLUDED.name),
        updated_at = now();

  UPDATE public.talents_solicitacao_acesso
  SET status = 'approved', decided_at = now(), decided_by = auth.uid()
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.talents_aprovar_solicitacao(uuid, text) TO authenticated;

-- 3) Admin recusa (rejected NAO reabre no proximo login).
CREATE OR REPLACE FUNCTION public.talents_recusar_solicitacao(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.talents_is_developer() OR public.talents_has_privileged_role('admin')) THEN
    RAISE EXCEPTION 'Apenas administradores podem recusar solicitacoes.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.talents_solicitacao_acesso
  SET status = 'rejected', decided_at = now(), decided_by = auth.uid()
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.talents_recusar_solicitacao(uuid) TO authenticated;

-- 4) Admin libera direto por e-mail (conta ja precisa ter logado ao menos 1x).
CREATE OR REPLACE FUNCTION public.talents_authorize_user(p_email text, p_role text)
RETURNS TABLE(user_id uuid, email text, full_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_name    text;
BEGIN
  IF NOT (public.talents_is_developer() OR public.talents_has_privileged_role('admin')) THEN
    RAISE EXCEPTION 'Apenas administradores do Talents podem liberar usuarios.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role NOT IN ('admin','editor','viewer') THEN
    RAISE EXCEPTION 'Perfil invalido: %', p_role;
  END IF;

  SELECT au.id, au.email::text,
         COALESCE(
           NULLIF(au.raw_user_meta_data->>'full_name', ''),
           NULLIF(au.raw_user_meta_data->>'name', ''),
           split_part(au.email, '@', 1)
         )
    INTO v_user_id, v_email, v_name
  FROM auth.users au
  WHERE lower(au.email) = lower(btrim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma conta encontrada para o e-mail %. A pessoa precisa entrar (Google) ao menos uma vez antes de ser liberada.', p_email
      USING ERRCODE = 'no_data_found';
  END IF;

  INSERT INTO public.talents_user_roles (user_id, email, name, role, ativo, created_at, last_login)
  VALUES (v_user_id, lower(trim(v_email)), v_name, p_role, true, now(), now())
  ON CONFLICT (email) DO UPDATE
    SET user_id    = EXCLUDED.user_id,
        role       = EXCLUDED.role,
        ativo      = true,
        name       = COALESCE(public.talents_user_roles.name, EXCLUDED.name),
        updated_at = now();

  UPDATE public.talents_solicitacao_acesso
  SET status = 'approved', decided_at = now(), decided_by = auth.uid()
  WHERE talents_solicitacao_acesso.user_id = v_user_id AND status = 'pending';

  RETURN QUERY SELECT v_user_id, v_email, v_name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.talents_authorize_user(text, text) TO authenticated;
