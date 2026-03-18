-- Gestores Young: garantir role editor (mínimo para RLS em jobs, applications, companies).
-- Não altera usuários que já são admin.
UPDATE young_talents.user_roles
SET role = 'editor', updated_at = NOW()
WHERE LOWER(TRIM(email)) IN (
  'carla@youngempreendimentos.com.br',
  'eduardo@youngempreendimentos.com.br',
  'suelen@youngempreendimentos.com.br',
  'antonio@youngempreendimentos.com.br',
  'matheus@youngempreendimentos.com.br'
)
AND role = 'viewer';
