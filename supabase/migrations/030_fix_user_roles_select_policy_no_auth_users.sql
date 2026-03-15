-- ==============================================================================
-- RLS: Remove leitura de auth.users da política "Usuários podem ler seu próprio role"
-- A expressão (user_id IS NULL AND email = (SELECT email FROM auth.users ...))
-- causa "permission denied for table users" no Supabase.
-- Com apenas (user_id = auth.uid()) usuários leem sua própria linha; linhas com
-- user_id NULL continuam visíveis para admin/dev via is_admin()/is_developer().
-- ==============================================================================

DROP POLICY IF EXISTS "Usuários podem ler seu próprio role" ON young_talents.user_roles;

CREATE POLICY "Usuários podem ler seu próprio role"
  ON young_talents.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
