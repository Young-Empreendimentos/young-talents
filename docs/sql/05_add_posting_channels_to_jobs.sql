-- Canais de divulgação da vaga (multi-seleção + textos livres para Faculdade, Agência, Outro)
-- Execute no SQL Editor do Supabase se aparecer erro: "Could not find the 'posting_channels' column of 'jobs'"
ALTER TABLE young_talents.jobs
  ADD COLUMN IF NOT EXISTS posting_channels JSONB;

COMMENT ON COLUMN young_talents.jobs.posting_channels IS 'Canais onde a vaga é/será divulgada. Ex: { "selected": ["linkedin", "infojobs"], "faculdade": "USP", "agencia": "", "outro": "" }';
