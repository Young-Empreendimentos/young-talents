-- ==============================================================================
-- RLS: Permissão total para desenvolvedor (user_id 6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4)
-- Inclui is_developer() em todas as políticas de dados mestres e vagas para que
-- devs possam adicionar empresas, cidades, vagas, etc.
-- ==============================================================================

-- 1. Atualizar is_developer() para incluir o user_id do desenvolvedor (por email ou por id)
CREATE OR REPLACE FUNCTION young_talents.is_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (
        'dev@local',
        'dev@adventurelabs.com.br',
        'developer@adventurelabs.com.br'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION young_talents.is_developer() IS 
  'Verifica se o usuário autenticado é um desenvolvedor (por user_id ou email). Desenvolvedores têm permissões de admin em RLS.';

-- 2. COMPANIES – incluir is_developer() em todas as políticas
DROP POLICY IF EXISTS "Admin e editor podem inserir companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Admin e editor podem atualizar companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Apenas admin pode deletar companies" ON young_talents.companies;

CREATE POLICY "Admin e editor podem inserir companies" ON young_talents.companies
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar companies" ON young_talents.companies
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar companies" ON young_talents.companies
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 3. CITIES
DROP POLICY IF EXISTS "Admin e editor podem inserir cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Admin e editor podem atualizar cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Apenas admin pode deletar cities" ON young_talents.cities;

CREATE POLICY "Admin e editor podem inserir cities" ON young_talents.cities
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar cities" ON young_talents.cities
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar cities" ON young_talents.cities
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 4. SECTORS
DROP POLICY IF EXISTS "Admin e editor podem inserir sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Admin e editor podem atualizar sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Apenas admin pode deletar sectors" ON young_talents.sectors;

CREATE POLICY "Admin e editor podem inserir sectors" ON young_talents.sectors
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar sectors" ON young_talents.sectors
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar sectors" ON young_talents.sectors
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 5. POSITIONS
DROP POLICY IF EXISTS "Admin e editor podem inserir positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Admin e editor podem atualizar positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Apenas admin pode deletar positions" ON young_talents.positions;

CREATE POLICY "Admin e editor podem inserir positions" ON young_talents.positions
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar positions" ON young_talents.positions
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar positions" ON young_talents.positions
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 6. JOBS (Vagas)
DROP POLICY IF EXISTS "Admin e editor podem inserir jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Admin e editor podem atualizar jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Apenas admin pode deletar jobs" ON young_talents.jobs;

CREATE POLICY "Admin e editor podem inserir jobs" ON young_talents.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar jobs" ON young_talents.jobs
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar jobs" ON young_talents.jobs
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 7. JOB_LEVELS
DROP POLICY IF EXISTS "Admin e editor podem inserir job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Admin e editor podem atualizar job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Apenas admin pode deletar job_levels" ON young_talents.job_levels;

CREATE POLICY "Admin e editor podem inserir job_levels" ON young_talents.job_levels
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar job_levels" ON young_talents.job_levels
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar job_levels" ON young_talents.job_levels
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 8. ACTIVITY_AREAS
DROP POLICY IF EXISTS "Admin e editor podem inserir activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Admin e editor podem atualizar activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Apenas admin pode deletar activity_areas" ON young_talents.activity_areas;

CREATE POLICY "Admin e editor podem inserir activity_areas" ON young_talents.activity_areas
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar activity_areas" ON young_talents.activity_areas
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar activity_areas" ON young_talents.activity_areas
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 9. APPLICATIONS
DROP POLICY IF EXISTS "Admin e editor podem gerenciar aplicações (Insert)" ON young_talents.applications;
DROP POLICY IF EXISTS "Admin e editor podem gerenciar aplicações (Update)" ON young_talents.applications;
DROP POLICY IF EXISTS "Apenas admin pode deletar aplicações" ON young_talents.applications;

CREATE POLICY "Admin e editor podem gerenciar aplicações (Insert)" ON young_talents.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem gerenciar aplicações (Update)" ON young_talents.applications
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar aplicações" ON young_talents.applications
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 10. CANDIDATES – incluir is_developer() para dev poder gerenciar candidatos
DROP POLICY IF EXISTS "Admin e editor podem inserir candidatos" ON young_talents.candidates;
DROP POLICY IF EXISTS "Admin e editor podem atualizar candidatos" ON young_talents.candidates;
DROP POLICY IF EXISTS "Apenas admin pode deletar candidatos" ON young_talents.candidates;

CREATE POLICY "Admin e editor podem inserir candidatos" ON young_talents.candidates
  FOR INSERT TO authenticated
  WITH CHECK (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Admin e editor podem atualizar candidatos" ON young_talents.candidates
  FOR UPDATE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor'))
  );
CREATE POLICY "Apenas admin pode deletar candidatos" ON young_talents.candidates
  FOR DELETE TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- 11. ACTIVITY_LOG – desenvolvedor pode ler log (como admin)
DROP POLICY IF EXISTS "Admin pode ler activity_log" ON young_talents.activity_log;

CREATE POLICY "Admin pode ler activity_log"
  ON young_talents.activity_log
  FOR SELECT
  TO authenticated
  USING (
    young_talents.is_developer()
    OR EXISTS (SELECT 1 FROM young_talents.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
