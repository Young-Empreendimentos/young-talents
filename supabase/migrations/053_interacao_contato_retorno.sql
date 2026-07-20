-- ============================================================================
-- Novo tipo de interação "Contato de retorno". Usado como pré-requisito para
-- arquivar um candidato (o front bloqueia o arquivamento sem essa interação).
-- Seed idempotente. Aplicada em produção em 2026-07-20.
-- ============================================================================
INSERT INTO public.talents_interaction_types (name, icon, is_active)
SELECT 'Contato de retorno', 'phone', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.talents_interaction_types WHERE name = 'Contato de retorno'
);
