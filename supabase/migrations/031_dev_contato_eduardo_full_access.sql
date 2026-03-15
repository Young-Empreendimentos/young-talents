-- ==============================================================================
-- RLS: Incluir contato@adventurelabs.com.br e eduardo@youngempreendimentos.com.br
-- como desenvolvedores (mesmo acesso total a tabelas e roles do young_talents).
-- UUIDs: contato 2e104a2a-4117-4bb8-9a84-526ed68af4f9, eduardo 5b9c32f6-7f6a-45e3-9c56-98def279fe69
-- ==============================================================================

-- 1. is_developer() passa a reconhecer os três usuários (dev, contato, eduardo)
CREATE OR REPLACE FUNCTION young_talents.is_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IN (
    '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid,  -- dev@adventurelabs.com.br
    '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid,  -- contato@adventurelabs.com.br
    '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid   -- eduardo@youngempreendimentos.com.br
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION young_talents.is_developer() IS 
  'Verifica se o usuário é desenvolvedor (dev, contato ou eduardo por user_id). Acesso total a tabelas e roles do young_talents.';

GRANT EXECUTE ON FUNCTION young_talents.is_developer() TO authenticated;

-- 2. Políticas explícitas para contato@ (2e104a2a)
CREATE POLICY "Dev 2e104a2a INSERT companies" ON young_talents.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE companies" ON young_talents.companies FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE companies" ON young_talents.companies FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT cities" ON young_talents.cities FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE cities" ON young_talents.cities FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE cities" ON young_talents.cities FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT sectors" ON young_talents.sectors FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE sectors" ON young_talents.sectors FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE sectors" ON young_talents.sectors FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT positions" ON young_talents.positions FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE positions" ON young_talents.positions FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE positions" ON young_talents.positions FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT jobs" ON young_talents.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE jobs" ON young_talents.jobs FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE jobs" ON young_talents.jobs FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT job_levels" ON young_talents.job_levels FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE job_levels" ON young_talents.job_levels FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE job_levels" ON young_talents.job_levels FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT activity_areas" ON young_talents.activity_areas FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE activity_areas" ON young_talents.activity_areas FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE activity_areas" ON young_talents.activity_areas FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT applications" ON young_talents.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE applications" ON young_talents.applications FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE applications" ON young_talents.applications FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a INSERT candidates" ON young_talents.candidates FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE candidates" ON young_talents.candidates FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE candidates" ON young_talents.candidates FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a SELECT user_roles" ON young_talents.user_roles FOR SELECT TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a INSERT user_roles" ON young_talents.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a UPDATE user_roles" ON young_talents.user_roles FOR UPDATE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);
CREATE POLICY "Dev 2e104a2a DELETE user_roles" ON young_talents.user_roles FOR DELETE TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

CREATE POLICY "Dev 2e104a2a SELECT activity_log" ON young_talents.activity_log FOR SELECT TO authenticated USING (auth.uid() = '2e104a2a-4117-4bb8-9a84-526ed68af4f9'::uuid);

-- 3. Políticas explícitas para eduardo@ (5b9c32f6)
CREATE POLICY "Dev 5b9c32f6 INSERT companies" ON young_talents.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE companies" ON young_talents.companies FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE companies" ON young_talents.companies FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT cities" ON young_talents.cities FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE cities" ON young_talents.cities FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE cities" ON young_talents.cities FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT sectors" ON young_talents.sectors FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE sectors" ON young_talents.sectors FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE sectors" ON young_talents.sectors FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT positions" ON young_talents.positions FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE positions" ON young_talents.positions FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE positions" ON young_talents.positions FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT jobs" ON young_talents.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE jobs" ON young_talents.jobs FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE jobs" ON young_talents.jobs FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT job_levels" ON young_talents.job_levels FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE job_levels" ON young_talents.job_levels FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE job_levels" ON young_talents.job_levels FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT activity_areas" ON young_talents.activity_areas FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE activity_areas" ON young_talents.activity_areas FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE activity_areas" ON young_talents.activity_areas FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT applications" ON young_talents.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE applications" ON young_talents.applications FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE applications" ON young_talents.applications FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 INSERT candidates" ON young_talents.candidates FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE candidates" ON young_talents.candidates FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE candidates" ON young_talents.candidates FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 SELECT user_roles" ON young_talents.user_roles FOR SELECT TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 INSERT user_roles" ON young_talents.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 UPDATE user_roles" ON young_talents.user_roles FOR UPDATE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
CREATE POLICY "Dev 5b9c32f6 DELETE user_roles" ON young_talents.user_roles FOR DELETE TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);

CREATE POLICY "Dev 5b9c32f6 SELECT activity_log" ON young_talents.activity_log FOR SELECT TO authenticated USING (auth.uid() = '5b9c32f6-7f6a-45e3-9c56-98def279fe69'::uuid);
