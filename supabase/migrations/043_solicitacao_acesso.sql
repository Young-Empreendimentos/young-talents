-- ==============================================================================
-- PADRAO PAVER NO TALENTS (2026-07-06) — 2/5
-- Fila de pedidos de acesso. 1 linha por usuario (status pending/approved/rejected).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.talents_solicitacao_acesso (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  full_name    text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at   timestamptz,
  decided_by   uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS talents_solicitacao_acesso_user_id_key
  ON public.talents_solicitacao_acesso(user_id);

CREATE INDEX IF NOT EXISTS talents_solicitacao_acesso_status_idx
  ON public.talents_solicitacao_acesso(status);

ALTER TABLE public.talents_solicitacao_acesso ENABLE ROW LEVEL SECURITY;

-- Admin/dev leem todas as solicitacoes (para o card de aprovacao na home).
DROP POLICY IF EXISTS "Admin le solicitacoes" ON public.talents_solicitacao_acesso;
CREATE POLICY "Admin le solicitacoes"
  ON public.talents_solicitacao_acesso
  FOR SELECT TO authenticated
  USING (public.talents_is_developer() OR public.talents_has_privileged_role('admin'));

-- Usuario le a propria solicitacao (para a tela "Acesso pendente").
DROP POLICY IF EXISTS "Usuario le propria solicitacao" ON public.talents_solicitacao_acesso;
CREATE POLICY "Usuario le propria solicitacao"
  ON public.talents_solicitacao_acesso
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Escrita apenas pelas RPCs SECURITY DEFINER (registrar/aprovar/recusar/authorize).
-- Sem policies de INSERT/UPDATE/DELETE para authenticated de proposito.
