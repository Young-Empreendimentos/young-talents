-- Migration 041: Sistema de Interações com Candidatos

-- 1. Tabela de tipos de interação (configurável)
CREATE TABLE IF NOT EXISTS public.talents_interaction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tipos padrão
INSERT INTO public.talents_interaction_types (name, icon) VALUES
  ('Entrevista Presencial', 'users'),
  ('Ligação Telefônica', 'phone'),
  ('Entrevista por Videochamada', 'video')
ON CONFLICT (name) DO NOTHING;

-- RLS: staff lê, admin gerencia
ALTER TABLE public.talents_interaction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_interaction_types"
ON public.talents_interaction_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_manage_interaction_types"
ON public.talents_interaction_types FOR ALL
TO authenticated
USING (public.has_privileged_role())
WITH CHECK (public.has_privileged_role());

-- 2. Tabela de interações
CREATE TABLE IF NOT EXISTS public.talents_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.talents_candidates(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by_email TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_candidate ON public.talents_interactions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interactions_occurred ON public.talents_interactions(occurred_at DESC);

-- RLS: staff lê e cria, admin gerencia tudo
ALTER TABLE public.talents_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_interactions"
ON public.talents_interactions FOR SELECT
TO authenticated
USING (public.has_staff_access());

CREATE POLICY "staff_insert_interactions"
ON public.talents_interactions FOR INSERT
TO authenticated
WITH CHECK (public.has_staff_access());

CREATE POLICY "admin_update_interactions"
ON public.talents_interactions FOR UPDATE
TO authenticated
USING (public.has_privileged_role())
WITH CHECK (public.has_privileged_role());

CREATE POLICY "admin_delete_interactions"
ON public.talents_interactions FOR DELETE
TO authenticated
USING (public.has_privileged_role());
