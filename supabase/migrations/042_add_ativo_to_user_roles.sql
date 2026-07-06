-- ==============================================================================
-- PADRAO PAVER NO TALENTS (2026-07-06) — 1/5
-- Flag de soft-disable por usuario. Talents nao tem tabela de profiles; o "ativo"
-- mora na propria tabela de papeis (talents_user_roles).
-- OBS: as migrations 001-041 deste repo referenciam o schema `young_talents`
-- (design historico). O banco VIVO usa tabelas base em `public.talents_*`.
-- Estas migrations (042+) miram a realidade: public.talents_*.
-- ==============================================================================

ALTER TABLE public.talents_user_roles
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.talents_user_roles.ativo IS
  'Soft-disable (padrao Paver): ativo=false bloqueia acesso na 2a validacao. Default true.';
