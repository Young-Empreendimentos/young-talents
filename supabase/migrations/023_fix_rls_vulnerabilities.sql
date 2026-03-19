-- ==============================================================================
-- FIX RLS: Bloqueia edição de dados mestres e vagas por usuários comuns
-- ==============================================================================

-- Função auxiliar (opcional, mas usaremos a checagem direta como já é feita em candidates)
-- A checagem será: EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))

-- 1. COMPANIES
DROP POLICY IF EXISTS "Authenticated insert companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Authenticated update companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Authenticated delete companies" ON young_talents.companies;

DROP POLICY IF EXISTS "Admin e editor podem inserir companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Admin e editor podem atualizar companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Apenas admin pode deletar companies" ON young_talents.companies;

CREATE POLICY "Admin e editor podem inserir companies" ON young_talents.companies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar companies" ON young_talents.companies FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar companies" ON young_talents.companies FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 2. CITIES
DROP POLICY IF EXISTS "Authenticated insert cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Authenticated update cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Authenticated delete cities" ON young_talents.cities;

DROP POLICY IF EXISTS "Admin e editor podem inserir cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Admin e editor podem atualizar cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Apenas admin pode deletar cities" ON young_talents.cities;

CREATE POLICY "Admin e editor podem inserir cities" ON young_talents.cities FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar cities" ON young_talents.cities FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar cities" ON young_talents.cities FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 3. SECTORS
DROP POLICY IF EXISTS "Authenticated insert sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Authenticated update sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Authenticated delete sectors" ON young_talents.sectors;

DROP POLICY IF EXISTS "Admin e editor podem inserir sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Admin e editor podem atualizar sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Apenas admin pode deletar sectors" ON young_talents.sectors;

CREATE POLICY "Admin e editor podem inserir sectors" ON young_talents.sectors FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar sectors" ON young_talents.sectors FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar sectors" ON young_talents.sectors FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 4. POSITIONS
DROP POLICY IF EXISTS "Authenticated insert positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Authenticated update positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Authenticated delete positions" ON young_talents.positions;

DROP POLICY IF EXISTS "Admin e editor podem inserir positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Admin e editor podem atualizar positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Apenas admin pode deletar positions" ON young_talents.positions;

CREATE POLICY "Admin e editor podem inserir positions" ON young_talents.positions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar positions" ON young_talents.positions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar positions" ON young_talents.positions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 5. JOBS (Vagas)
DROP POLICY IF EXISTS "Authenticated insert jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Authenticated update jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Authenticated delete jobs" ON young_talents.jobs;

DROP POLICY IF EXISTS "Admin e editor podem inserir jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Admin e editor podem atualizar jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Apenas admin pode deletar jobs" ON young_talents.jobs;

CREATE POLICY "Admin e editor podem inserir jobs" ON young_talents.jobs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar jobs" ON young_talents.jobs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar jobs" ON young_talents.jobs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 6. JOB_LEVELS
DROP POLICY IF EXISTS "Authenticated insert job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Authenticated update job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Authenticated delete job_levels" ON young_talents.job_levels;

DROP POLICY IF EXISTS "Admin e editor podem inserir job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Admin e editor podem atualizar job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Apenas admin pode deletar job_levels" ON young_talents.job_levels;

CREATE POLICY "Admin e editor podem inserir job_levels" ON young_talents.job_levels FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar job_levels" ON young_talents.job_levels FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar job_levels" ON young_talents.job_levels FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 7. ACTIVITY_AREAS
DROP POLICY IF EXISTS "Authenticated insert activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Authenticated update activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Authenticated delete activity_areas" ON young_talents.activity_areas;

DROP POLICY IF EXISTS "Admin e editor podem inserir activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Admin e editor podem atualizar activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Apenas admin pode deletar activity_areas" ON young_talents.activity_areas;

CREATE POLICY "Admin e editor podem inserir activity_areas" ON young_talents.activity_areas FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem atualizar activity_areas" ON young_talents.activity_areas FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar activity_areas" ON young_talents.activity_areas FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 8. APPLICATIONS
DROP POLICY IF EXISTS "Authenticated insert applications" ON young_talents.applications;
DROP POLICY IF EXISTS "Authenticated update applications" ON young_talents.applications;
DROP POLICY IF EXISTS "Authenticated delete applications" ON young_talents.applications;

DROP POLICY IF EXISTS "Admin e editor podem gerenciar aplicações (Insert)" ON young_talents.applications;
DROP POLICY IF EXISTS "Admin e editor podem gerenciar aplicações (Update)" ON young_talents.applications;
DROP POLICY IF EXISTS "Apenas admin pode deletar aplicações" ON young_talents.applications;

CREATE POLICY "Admin e editor podem gerenciar aplicações (Insert)" ON young_talents.applications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admin e editor podem gerenciar aplicações (Update)" ON young_talents.applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Apenas admin pode deletar aplicações" ON young_talents.applications FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM young_talents.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Criar política especial para candidatos aplicando via painel público, caso se registrem.
-- Mas como não temos certeza de qual é o fluxo do candidato (anon ou auth sem role),
-- vamos manter apenas os administradores/editores modificando os dados críticos de processo seletivo pelo painel por enquanto.
