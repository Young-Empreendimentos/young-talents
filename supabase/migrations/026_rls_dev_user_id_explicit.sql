-- ==============================================================================
-- RLS: Políticas explícitas por user_id para dev (6d3c9cde) – contorna qualquer
-- falha na avaliação de is_developer() ou leitura de user_roles.
-- Dev: dev@adventurelabs.com.br já está em user_roles como admin no Young Talents.
-- ==============================================================================

-- Idempotência: o Supabase remoto pode já ter criado policies com os mesmos nomes.
-- Antes de recriar, removemos as policies existentes.

-- COMPANIES
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE companies" ON young_talents.companies;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE companies" ON young_talents.companies;

-- CITIES
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE cities" ON young_talents.cities;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE cities" ON young_talents.cities;

-- SECTORS
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE sectors" ON young_talents.sectors;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE sectors" ON young_talents.sectors;

-- POSITIONS
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE positions" ON young_talents.positions;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE positions" ON young_talents.positions;

-- JOBS
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE jobs" ON young_talents.jobs;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE jobs" ON young_talents.jobs;

-- JOB_LEVELS
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE job_levels" ON young_talents.job_levels;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE job_levels" ON young_talents.job_levels;

-- ACTIVITY_AREAS
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE activity_areas" ON young_talents.activity_areas;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE activity_areas" ON young_talents.activity_areas;

-- APPLICATIONS
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT applications" ON young_talents.applications;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE applications" ON young_talents.applications;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE applications" ON young_talents.applications;

-- CANDIDATES
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT candidates" ON young_talents.candidates;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE candidates" ON young_talents.candidates;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE candidates" ON young_talents.candidates;

-- USER_ROLES
DROP POLICY IF EXISTS "Dev 6d3c9cde SELECT user_roles" ON young_talents.user_roles;
DROP POLICY IF EXISTS "Dev 6d3c9cde INSERT user_roles" ON young_talents.user_roles;
DROP POLICY IF EXISTS "Dev 6d3c9cde UPDATE user_roles" ON young_talents.user_roles;
DROP POLICY IF EXISTS "Dev 6d3c9cde DELETE user_roles" ON young_talents.user_roles;

-- ACTIVITY_LOG
DROP POLICY IF EXISTS "Dev 6d3c9cde SELECT activity_log" ON young_talents.activity_log;

-- COMPANIES
CREATE POLICY "Dev 6d3c9cde INSERT companies"
  ON young_talents.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE companies"
  ON young_talents.companies FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE companies"
  ON young_talents.companies FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- CITIES
CREATE POLICY "Dev 6d3c9cde INSERT cities"
  ON young_talents.cities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE cities"
  ON young_talents.cities FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE cities"
  ON young_talents.cities FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- SECTORS
CREATE POLICY "Dev 6d3c9cde INSERT sectors"
  ON young_talents.sectors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE sectors"
  ON young_talents.sectors FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE sectors"
  ON young_talents.sectors FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- POSITIONS
CREATE POLICY "Dev 6d3c9cde INSERT positions"
  ON young_talents.positions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE positions"
  ON young_talents.positions FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE positions"
  ON young_talents.positions FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- JOBS
CREATE POLICY "Dev 6d3c9cde INSERT jobs"
  ON young_talents.jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE jobs"
  ON young_talents.jobs FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE jobs"
  ON young_talents.jobs FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- JOB_LEVELS
CREATE POLICY "Dev 6d3c9cde INSERT job_levels"
  ON young_talents.job_levels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE job_levels"
  ON young_talents.job_levels FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE job_levels"
  ON young_talents.job_levels FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- ACTIVITY_AREAS
CREATE POLICY "Dev 6d3c9cde INSERT activity_areas"
  ON young_talents.activity_areas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE activity_areas"
  ON young_talents.activity_areas FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE activity_areas"
  ON young_talents.activity_areas FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- APPLICATIONS
CREATE POLICY "Dev 6d3c9cde INSERT applications"
  ON young_talents.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE applications"
  ON young_talents.applications FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE applications"
  ON young_talents.applications FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- CANDIDATES
CREATE POLICY "Dev 6d3c9cde INSERT candidates"
  ON young_talents.candidates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE candidates"
  ON young_talents.candidates FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE candidates"
  ON young_talents.candidates FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- USER_ROLES (dev pode gerenciar)
CREATE POLICY "Dev 6d3c9cde SELECT user_roles"
  ON young_talents.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde INSERT user_roles"
  ON young_talents.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde UPDATE user_roles"
  ON young_talents.user_roles FOR UPDATE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

CREATE POLICY "Dev 6d3c9cde DELETE user_roles"
  ON young_talents.user_roles FOR DELETE TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);

-- ACTIVITY_LOG (dev pode ler)
CREATE POLICY "Dev 6d3c9cde SELECT activity_log"
  ON young_talents.activity_log FOR SELECT TO authenticated
  USING (auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid);
