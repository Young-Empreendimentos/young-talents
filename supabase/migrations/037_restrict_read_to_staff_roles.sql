-- ==============================================================================
-- SEGURANÇA: Restringir SELECT a usuários com papel em user_roles (admin/editor/viewer)
-- Problema: políticas "Authenticated read ... USING (true)" e leitura de candidatos
-- permitiam que QUALQUER JWT autenticado lesse todos os dados (PII).
-- O trigger sync_user_role_on_login cria viewer para novos logins; sem isso ainda
-- é obrigatório restringir leitura na camada RLS + controles de signup (Supabase/Clerk).
-- ==============================================================================

CREATE OR REPLACE FUNCTION young_talents.has_staff_access()
RETURNS BOOLEAN AS $$
DECLARE
  jwt_email TEXT;
BEGIN
  IF young_talents.is_developer() THEN
    RETURN TRUE;
  END IF;

  jwt_email := LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')));

  RETURN EXISTS (
    SELECT 1 FROM young_talents.user_roles ur
    WHERE ur.role IN ('admin', 'editor', 'viewer')
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, young_talents;

COMMENT ON FUNCTION young_talents.has_staff_access() IS
  'True se o usuário tem papel staff (admin/editor/viewer) em user_roles, por user_id ou email no JWT (user_id NULL). Usado em SELECT RLS.';

GRANT EXECUTE ON FUNCTION young_talents.has_staff_access() TO authenticated;

-- CANDIDATES
DROP POLICY IF EXISTS "Usuários autenticados podem ler candidatos" ON young_talents.candidates;
CREATE POLICY "Staff pode ler candidatos"
  ON young_talents.candidates
  FOR SELECT
  TO authenticated
  USING (young_talents.has_staff_access());

-- APPLICATIONS
DROP POLICY IF EXISTS "Authenticated read applications" ON young_talents.applications;
CREATE POLICY "Staff pode ler applications"
  ON young_talents.applications
  FOR SELECT
  TO authenticated
  USING (young_talents.has_staff_access());

-- MASTERS + JOBS (SELECT apenas staff; mutações continuam nas políticas 023/024/035)
DROP POLICY IF EXISTS "Authenticated read companies" ON young_talents.companies;
CREATE POLICY "Staff pode ler companies"
  ON young_talents.companies FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

DROP POLICY IF EXISTS "Authenticated read cities" ON young_talents.cities;
CREATE POLICY "Staff pode ler cities"
  ON young_talents.cities FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

DROP POLICY IF EXISTS "Authenticated read sectors" ON young_talents.sectors;
CREATE POLICY "Staff pode ler sectors"
  ON young_talents.sectors FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

DROP POLICY IF EXISTS "Authenticated read positions" ON young_talents.positions;
CREATE POLICY "Staff pode ler positions"
  ON young_talents.positions FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

DROP POLICY IF EXISTS "Authenticated read jobs" ON young_talents.jobs;
CREATE POLICY "Staff pode ler jobs"
  ON young_talents.jobs FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

DROP POLICY IF EXISTS "Authenticated read job_levels" ON young_talents.job_levels;
CREATE POLICY "Staff pode ler job_levels"
  ON young_talents.job_levels FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

DROP POLICY IF EXISTS "Authenticated read activity_areas" ON young_talents.activity_areas;
CREATE POLICY "Staff pode ler activity_areas"
  ON young_talents.activity_areas FOR SELECT TO authenticated
  USING (young_talents.has_staff_access());

-- Formulário público: apenas INSERT (não listar / alterar base com anon)
REVOKE SELECT, UPDATE, DELETE ON public.candidates FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON young_talents.candidates FROM anon;
