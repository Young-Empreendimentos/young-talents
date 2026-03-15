-- ==============================================================================
-- RLS: Corrige recursão infinita em user_roles
-- Erro: "infinite recursion detected in policy for relation user_roles"
-- As políticas atuais fazem EXISTS (SELECT FROM user_roles) para decidir permissão,
-- o que dispara nova avaliação de RLS em user_roles → recursão.
-- Solução: função is_admin() SECURITY DEFINER que lê user_roles sem RLS.
-- ==============================================================================

-- Função que verifica se o usuário atual tem role admin em user_roles.
-- SECURITY DEFINER = roda com privilégios do owner, lendo user_roles sem RLS (sem recursão).
CREATE OR REPLACE FUNCTION young_talents.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM young_talents.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, young_talents;

COMMENT ON FUNCTION young_talents.is_admin() IS 
  'Verifica se o usuário atual tem role admin em user_roles. Usado nas políticas RLS para evitar recursão.';

GRANT EXECUTE ON FUNCTION young_talents.is_admin() TO authenticated;

-- Remover políticas que causam recursão e recriar usando is_admin() / is_developer()

DROP POLICY IF EXISTS "Admin pode ler todos os roles" ON young_talents.user_roles;
CREATE POLICY "Admin pode ler todos os roles"
  ON young_talents.user_roles
  FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid())
    OR young_talents.is_admin()
    OR young_talents.is_developer()
  );

DROP POLICY IF EXISTS "Apenas admin pode inserir roles" ON young_talents.user_roles;
CREATE POLICY "Apenas admin pode inserir roles"
  ON young_talents.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    young_talents.is_admin()
    OR young_talents.is_developer()
  );

DROP POLICY IF EXISTS "Apenas admin pode atualizar roles" ON young_talents.user_roles;
CREATE POLICY "Apenas admin pode atualizar roles"
  ON young_talents.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    young_talents.is_admin()
    OR young_talents.is_developer()
  );

DROP POLICY IF EXISTS "Apenas admin pode deletar roles" ON young_talents.user_roles;
CREATE POLICY "Apenas admin pode deletar roles"
  ON young_talents.user_roles
  FOR DELETE
  TO authenticated
  USING (
    young_talents.is_admin()
    OR young_talents.is_developer()
  );
