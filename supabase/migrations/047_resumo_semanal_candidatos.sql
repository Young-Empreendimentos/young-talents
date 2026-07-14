-- ============================================================================
-- Fonte de dados do "Resumo semanal de novos candidatos" (bot n8n).
-- A prova de gaps: marca d'agua (last_window_end) so avanca apos envio confirmado.
-- Funcoes restritas ao service_role (o n8n chama com a service_role key).
-- Aplicada em producao em 2026-07-10.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.talents_resumo_controle (
  chave           text PRIMARY KEY,
  last_window_end timestamptz NOT NULL DEFAULT (now() - interval '7 days'),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.talents_resumo_controle(chave)
VALUES ('novos_candidatos')
ON CONFLICT (chave) DO NOTHING;

ALTER TABLE public.talents_resumo_controle ENABLE ROW LEVEL SECURITY;
-- Sem policies: apenas as RPCs SECURITY DEFINER e o service_role acessam.

-- 1) Devolve os candidatos novos desde a ultima marca d'agua (default: 7 dias).
--    Dedup por e-mail (mantem o mais recente). NAO avanca a marca.
CREATE OR REPLACE FUNCTION public.talents_resumo_candidatos_semana()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_desde  timestamptz;
  v_ate    timestamptz := now();
  v_result jsonb;
BEGIN
  SELECT last_window_end INTO v_desde
  FROM public.talents_resumo_controle WHERE chave = 'novos_candidatos';
  IF v_desde IS NULL THEN v_desde := now() - interval '7 days'; END IF;

  WITH base AS (
    SELECT c.*,
           row_number() OVER (
             PARTITION BY COALESCE(lower(trim(c.email)), c.id::text)
             ORDER BY c.created_at DESC
           ) AS rn
    FROM public.talents_candidates c
    WHERE c.deleted_at IS NULL
      AND c.created_at >  v_desde
      AND c.created_at <= v_ate
  ),
  uniq AS (SELECT * FROM base WHERE rn = 1)
  SELECT jsonb_build_object(
    'desde', v_desde,
    'ate',   v_ate,
    'total', (SELECT count(*) FROM uniq),
    'candidatos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'nome',               u.full_name,
        'email',              u.email,
        'telefone',           u.phone,
        'cidade',             u.city,
        'idade',              u.age,
        'area_interesse',     u.interest_areas,
        'escolaridade',       u.schooling_level,
        'formacao',           u.education,
        'instituicao',        u.institution,
        'esta_estudando',     u.is_studying,
        'experiencia',        u.experience,
        'cursos',             u.courses,
        'certificacoes',      u.certifications,
        'pretensao_salarial', u.salary_expectation,
        'disponivel_mudanca', u.can_relocate,
        'cnh',                u.has_license,
        'origem',             u.origin,
        'fonte',              u.source,
        'status',             u.status,
        'cv_url',             u.cv_url,
        'portfolio_url',      u.portfolio_url,
        'campo_livre',        u.free_field,
        'criado_em',          u.created_at
      ) ORDER BY u.created_at DESC)
      FROM uniq u
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.talents_resumo_candidatos_semana() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.talents_resumo_candidatos_semana() TO service_role;

-- 2) Avanca a marca d'agua (chamada pelo n8n APOS o e-mail ser enviado).
--    Recebe o mesmo 'ate' devolvido pela funcao acima -> janela exata, sem gap.
CREATE OR REPLACE FUNCTION public.talents_resumo_marcar_enviado(p_ate timestamptz)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.talents_resumo_controle
  SET last_window_end = p_ate, updated_at = now()
  WHERE chave = 'novos_candidatos';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.talents_resumo_marcar_enviado(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.talents_resumo_marcar_enviado(timestamptz) TO service_role;

-- Rollback:
--   DROP FUNCTION IF EXISTS public.talents_resumo_candidatos_semana();
--   DROP FUNCTION IF EXISTS public.talents_resumo_marcar_enviado(timestamptz);
--   DROP TABLE IF EXISTS public.talents_resumo_controle;
