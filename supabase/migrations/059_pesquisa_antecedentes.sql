-- ============================================================================
-- Pesquisa de antecedentes (1 registro por candidato) + bucket PRIVADO para os
-- anexos (dado sensível — não pode ficar público como as fotos).
-- Acesso: qualquer staff autenticado (igual às demais sub-tabelas do candidato).
-- Aplicada em produção em 2026-10-08.
-- ============================================================================

CREATE TABLE IF NOT EXISTS rh.talents_background_checks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    uuid NOT NULL UNIQUE REFERENCES rh.talents_candidates(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'Pendente',  -- Pendente / Nada consta / Encontrado algo
  notes           text,
  check_date      date,
  attachments     jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{ name, path }]
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  created_by      text,
  created_by_name text
);

GRANT ALL ON rh.talents_background_checks TO anon, authenticated, service_role;
ALTER TABLE rh.talents_background_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_read_bg   ON rh.talents_background_checks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_insert_bg ON rh.talents_background_checks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_update_bg ON rh.talents_background_checks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY authenticated_delete_bg ON rh.talents_background_checks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Bucket PRIVADO (public=false) para os anexos da pesquisa de antecedentes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: qualquer autenticado gerencia os objetos desse bucket (download por signed URL).
CREATE POLICY "candidate_documents_read"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'candidate-documents');
CREATE POLICY "candidate_documents_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'candidate-documents');
CREATE POLICY "candidate_documents_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'candidate-documents');
CREATE POLICY "candidate_documents_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'candidate-documents');
