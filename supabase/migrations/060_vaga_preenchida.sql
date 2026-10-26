-- ============================================================================
-- Vaga "Preenchida": registrar QUAL candidato do banco preencheu e a DATA DE
-- INÍCIO dele. Colunas em talents_jobs. Aplicada em produção em 2026-10-26.
-- ============================================================================
ALTER TABLE rh.talents_jobs
  ADD COLUMN IF NOT EXISTS filled_by_candidate_id uuid REFERENCES rh.talents_candidates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS filled_start_date      date,
  ADD COLUMN IF NOT EXISTS filled_at              timestamptz;

CREATE INDEX IF NOT EXISTS idx_jobs_filled_by ON rh.talents_jobs (filled_by_candidate_id);
