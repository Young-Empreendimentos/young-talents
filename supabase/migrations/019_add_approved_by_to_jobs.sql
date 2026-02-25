-- Campo "Quem autorizou a abertura" da vaga (responsável pela solicitação/autorização)
ALTER TABLE young_talents.jobs
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

COMMENT ON COLUMN young_talents.jobs.approved_by IS 'Responsável pela solicitação e autorização da abertura da vaga (não quem abre no sistema).';
