-- YT-10: Permissão para vincular candidato à vaga (candidaturas/applications)
-- 1) Sincroniza user_id em user_roles onde está NULL e o email existe em auth.users.
-- 2) Função is_editor_or_admin(): considera user_id OU email do JWT (quem tem user_id NULL mas role editor/admin).
-- 3) Políticas de applications passam a usar is_editor_or_admin() para INSERT/UPDATE (evita bloqueio por user_id NULL).

-- 1. One-off: preencher user_id onde está NULL e o email existe em auth.users
UPDATE young_talents.user_roles ur
SET user_id = au.id,
    updated_at = NOW()
FROM auth.users au
WHERE ur.user_id IS NULL
  AND LOWER(TRIM(ur.email)) = LOWER(au.email);

-- 2. Função que verifica se o usuário atual tem role admin ou editor (por user_id ou por email no JWT)
--    Assim, usuários pré-cadastrados com user_id NULL ainda passam nas políticas de applications.
CREATE OR REPLACE FUNCTION young_talents.is_editor_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  jwt_email TEXT;
BEGIN
  jwt_email := LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')));
  RETURN EXISTS (
    SELECT 1 FROM young_talents.user_roles ur
    WHERE ur.role IN ('admin', 'editor')
    AND (
      ur.user_id = auth.uid()
      OR (ur.user_id IS NULL AND jwt_email IS NOT NULL AND LOWER(TRIM(ur.email)) = jwt_email)
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, young_talents;

COMMENT ON FUNCTION young_talents.is_editor_or_admin() IS
  'True se o usuário atual tem role admin ou editor (por user_id ou por email no JWT). Usado em RLS de applications (YT-10).';

GRANT EXECUTE ON FUNCTION young_talents.is_editor_or_admin() TO authenticated;

-- 3. Aplicações: permitir INSERT/UPDATE para editor ou admin (incl. quando identificado por email no JWT)
DROP POLICY IF EXISTS "Admin e editor podem gerenciar aplicações (Insert)" ON young_talents.applications;
DROP POLICY IF EXISTS "Admin e editor podem gerenciar aplicações (Update)" ON young_talents.applications;

CREATE POLICY "Admin e editor podem gerenciar aplicações (Insert)" ON young_talents.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR young_talents.is_editor_or_admin()
  );

CREATE POLICY "Admin e editor podem gerenciar aplicações (Update)" ON young_talents.applications
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR young_talents.is_editor_or_admin()
  );
