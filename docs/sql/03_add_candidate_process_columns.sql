-- Colunas de processo do candidato (entrevistas, closed_at, etc.)
-- Execute no SQL Editor do Supabase se aparecer erro: Could not find the 'closed_at' (ou outras) column of 'candidates'

ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview1_date TIMESTAMPTZ;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview1_notes TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview2_date TIMESTAMPTZ;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS interview2_notes TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS manager_feedback TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS test_results TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS return_sent TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS return_notes TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE young_talents.candidates ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
