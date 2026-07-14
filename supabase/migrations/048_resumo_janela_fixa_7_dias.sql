-- ============================================================================
-- Simplifica o "Resumo semanal de novos candidatos" para janela FIXA de 7 dias
-- de cadastro (created_at). Substitui o modelo de marca d'agua da migration 047.
-- Remove talents_resumo_marcar_enviado e talents_resumo_controle (nao usados).
-- Aplicada em producao em 2026-07-10.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.talents_resumo_candidatos_semana()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_desde  timestamptz := now() - interval '7 days';
  v_ate    timestamptz := now();
  v_result jsonb;
BEGIN
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

DROP FUNCTION IF EXISTS public.talents_resumo_marcar_enviado(timestamptz);
DROP TABLE IF EXISTS public.talents_resumo_controle;
