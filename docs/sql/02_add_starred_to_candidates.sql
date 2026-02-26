-- Coluna "Em consideração" (estrela) na tabela de candidatos
-- Execute no SQL Editor do Supabase se aparecer erro: Could not find the 'starred' column of 'candidates'

ALTER TABLE young_talents.candidates
  ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;

COMMENT ON COLUMN young_talents.candidates.starred IS 'Marcação "em consideração" para filtro na pipeline e banco de talentos';
