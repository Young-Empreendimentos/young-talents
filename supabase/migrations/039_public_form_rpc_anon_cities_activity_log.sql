-- ==============================================================================
-- 039: Formulário público (/apply) + hardening activity_log + sync e-mail case-insensitive
-- Depende: 037 (has_staff_access, SELECT staff), 038 (sync sem viewer automático).
-- Complementa o path clients/.../028_* para quem faz deploy só pelo repo plataforma.
-- ==============================================================================

-- 1) Duplicidade de e-mail sem listar a base (SECURITY DEFINER bypassa RLS na leitura)
CREATE OR REPLACE FUNCTION public.public_candidate_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = young_talents, public
AS $func$
  SELECT EXISTS (
    SELECT 1
    FROM young_talents.candidates c
    WHERE p_email IS NOT NULL
      AND length(trim(p_email)) > 0
      AND lower(trim(c.email)) = lower(trim(p_email))
      AND c.deleted_at IS NULL
  );
$func$;

COMMENT ON FUNCTION public.public_candidate_email_exists(text) IS
  'Usado pelo /apply: retorna se já existe candidato ativo com o e-mail, sem listar dados.';

REVOKE ALL ON FUNCTION public.public_candidate_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_candidate_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.public_candidate_email_exists(text) TO authenticated;

-- 2) Cidades: leitura pública para o formulário (dados não sensíveis)
GRANT SELECT ON young_talents.cities TO anon;

DROP POLICY IF EXISTS "Anon pode ler cities (formulário público)" ON young_talents.cities;
CREATE POLICY "Anon pode ler cities (formulário público)"
  ON young_talents.cities
  FOR SELECT
  TO anon
  USING (true);

-- 3) activity_log: só staff insere (evita spam de sessões órfãs)
DROP POLICY IF EXISTS "Autenticado pode inserir activity_log" ON young_talents.activity_log;
CREATE POLICY "Staff pode inserir activity_log"
  ON young_talents.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (young_talents.has_staff_access());

-- 4) sync_user_role_on_login: match de e-mail case-insensitive (alinha a 025/clients e pré-cadastros)
CREATE OR REPLACE FUNCTION young_talents.sync_user_role_on_login()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
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
  FROM young_talents.user_roles
  WHERE lower(trim(email)) = lower(trim(user_email))
  LIMIT 1;

  IF FOUND THEN
    UPDATE young_talents.user_roles
    SET
      user_id = NEW.id,
      name = COALESCE(user_name, existing_role.name),
      photo = COALESCE(user_photo, existing_role.photo),
      last_login = NOW(),
      updated_at = NOW()
    WHERE id = existing_role.id;

    RAISE NOTICE 'Sincronizado user_role para % (ID: %)', user_email, NEW.id;
  ELSE
    RAISE NOTICE 'Nenhum user_role encontrado para %, nenhum registro criado (login sem acesso).', user_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = young_talents, public;

COMMENT ON FUNCTION young_talents.sync_user_role_on_login() IS
  'Sincroniza user_roles quando já existe linha (match e-mail case-insensitive). Não cria viewer automático.';
