-- ============================================================================
-- Fix: "column reference \"email\" is ambiguous" ao liberar acesso por e-mail.
-- A funcao declara RETURNS TABLE(user_id, email, full_name), o que cria variaveis
-- de saida com esses nomes; no INSERT ... ON CONFLICT (email) o identificador
-- "email" ficava ambiguo (variavel de saida x coluna da tabela).
-- Correcao: diretiva #variable_conflict use_column (resolve identificadores
-- ambiguos como COLUNA — correto aqui, pois a logica usa variaveis v_/p_).
-- Aplicada em producao em 2026-07-21.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.talents_authorize_user(p_email text, p_role text)
RETURNS TABLE(user_id uuid, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'rh', 'public'
AS $function$
#variable_conflict use_column
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

  INSERT INTO rh.talents_user_roles (user_id, email, name, role, ativo, created_at, last_login)
  VALUES (v_user_id, lower(trim(v_email)), v_name, p_role, true, now(), now())
  ON CONFLICT (email) DO UPDATE
    SET user_id    = EXCLUDED.user_id,
        role       = EXCLUDED.role,
        ativo      = true,
        name       = COALESCE(rh.talents_user_roles.name, EXCLUDED.name),
        updated_at = now();

  UPDATE rh.talents_solicitacao_acesso
  SET status = 'approved', decided_at = now(), decided_by = auth.uid()
  WHERE talents_solicitacao_acesso.user_id = v_user_id AND status = 'pending';

  RETURN QUERY SELECT v_user_id, v_email, v_name;
END;
$function$;
