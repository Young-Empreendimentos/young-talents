-- Add starred (em consideração) flag to candidates
ALTER TABLE young_talents.candidates
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;

COMMENT ON COLUMN young_talents.candidates.starred IS 'Marcação "em consideração" para filtro na etapa Inscrito';
