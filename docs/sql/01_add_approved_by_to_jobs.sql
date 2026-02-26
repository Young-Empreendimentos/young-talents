-- Coluna "Quem autorizou a abertura" na tabela de vagas (jobs)
-- Execute no SQL Editor do Supabase se aparecer erro: Could not find the 'approved_by' column of 'jobs'

ALTER TABLE young_talents.jobs
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

COMMENT ON COLUMN young_talents.jobs.approved_by IS 'Responsável pela solicitação e autorização da abertura da vaga (não quem abre no sistema).';
