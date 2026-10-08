-- ============================================================================
-- Testes: catálogo de tipos de teste (a Carla cadastra) + testes feitos por
-- candidato (vínculo candidato x tipo, com resultado estruturado).
-- Espelha o padrão de acesso de talents_interactions (RLS authenticated;
-- grants p/ anon/authenticated/service_role). Tabelas no schema rh.
-- Aplicada em produção em 2026-10-08.
-- ============================================================================

-- Catálogo de tipos de teste (gerenciado pela Carla / staff)
CREATE TABLE IF NOT EXISTS rh.talents_test_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text,
  description text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  text
);

-- Teste feito por um candidato (o vínculo + resultado)
CREATE TABLE IF NOT EXISTS rh.talents_candidate_tests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    uuid NOT NULL REFERENCES rh.talents_candidates(id) ON DELETE CASCADE,
  test_type_id    uuid NOT NULL REFERENCES rh.talents_test_types(id) ON DELETE RESTRICT,
  test_date       date,
  status          text NOT NULL DEFAULT 'Pendente',  -- Pendente / Realizado / Cancelado
  result          text,                              -- Aprovado / Aprovado com ressalvas / Reprovado / null
  score           numeric,                           -- 0-10 (opcional)
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  created_by      text,
  created_by_name text
);
CREATE INDEX IF NOT EXISTS idx_candidate_tests_candidate ON rh.talents_candidate_tests (candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_tests_type      ON rh.talents_candidate_tests (test_type_id);

-- Grants (mesmo conjunto das tabelas irmãs; o RLS é que gateia de fato)
GRANT ALL ON rh.talents_test_types      TO anon, authenticated, service_role;
GRANT ALL ON rh.talents_candidate_tests TO anon, authenticated, service_role;

-- RLS (padrão de talents_interactions: qualquer usuário autenticado)
ALTER TABLE rh.talents_test_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.talents_candidate_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_read_test_types   ON rh.talents_test_types FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_insert_test_types ON rh.talents_test_types FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_update_test_types ON rh.talents_test_types FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_delete_test_types ON rh.talents_test_types FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY authenticated_read_candidate_tests   ON rh.talents_candidate_tests FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_insert_candidate_tests ON rh.talents_candidate_tests FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_update_candidate_tests ON rh.talents_candidate_tests FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_delete_candidate_tests ON rh.talents_candidate_tests FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
