-- YT-08: Garantir que gestores Young tenham role editor para poder cadastrar empresas/empreendimentos.
-- Atualiza qualquer um desses e-mails que ainda não for admin (evita downgrade).
-- Complementa 032 que só atualizava role = 'viewer'; aqui atualizamos também quem tenha outro role (ex.: gestor antigo).
UPDATE young_talents.user_roles
SET role = 'editor', updated_at = NOW()
WHERE LOWER(TRIM(email)) IN (
  'carla@youngempreendimentos.com.br',
  'eduardo@youngempreendimentos.com.br',
  'suelen@youngempreendimentos.com.br',
  'antonio@youngempreendimentos.com.br',
  'matheus@youngempreendimentos.com.br'
)
AND (role IS NULL OR role != 'admin');
