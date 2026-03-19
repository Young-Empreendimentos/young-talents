-- YT-05: Quem solicitou a abertura da vaga (usuário do sistema que criou a vaga)
-- approved_by permanece como "Quem autorizou a abertura" (texto/nome).
-- requested_by_user_id = usuário autenticado que criou o registro (rastreabilidade).

ALTER TABLE young_talents.jobs
  ADD COLUMN IF NOT EXISTS requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN young_talents.jobs.requested_by_user_id IS 'Usuário do sistema que solicitou/criou a abertura da vaga (preenchido automaticamente no INSERT).';
COMMENT ON COLUMN young_talents.jobs.approved_by IS 'Quem autorizou a abertura da vaga (nome ou e-mail, pode ser selecionado na tela).';

-- Trigger: ao inserir vaga, preencher requested_by_user_id com o usuário logado (se ainda estiver nulo)
CREATE OR REPLACE FUNCTION young_talents.set_job_requested_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = young_talents, public
AS $$
BEGIN
  IF NEW.requested_by_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.requested_by_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_job_requested_by_trigger ON young_talents.jobs;
CREATE TRIGGER set_job_requested_by_trigger
  BEFORE INSERT ON young_talents.jobs
  FOR EACH ROW
  EXECUTE FUNCTION young_talents.set_job_requested_by();

CREATE INDEX IF NOT EXISTS idx_jobs_requested_by_user_id ON young_talents.jobs(requested_by_user_id);
