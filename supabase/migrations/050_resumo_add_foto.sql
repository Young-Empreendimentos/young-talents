-- ============================================================================
-- Adiciona o campo `foto` ao retorno de talents_resumo_candidatos_semana.
-- Monta a URL publica do bucket `candidate-photos` quando `photo_url` e' so o
-- nome/caminho do arquivo; se ja for URL completa usa como esta'; se for link
-- do Google Drive (nao renderiza em <img>) devolve NULL; vazio -> NULL.
-- Aplicada em producao em 2026-07-10 (arquivada no repo em 2026-07-14).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.talents_resumo_candidatos_semana(p_dias integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_dias   integer := GREATEST(COALESCE(p_dias, 7), 1);
  v_desde  timestamptz := now() - make_interval(days => v_dias);
  v_ate    timestamptz := now();
  v_base   text := 'https://vvtympzatclvjaqucebr.supabase.co/storage/v1/object/public/candidate-photos/';
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
    'dias',  v_dias,
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
        'criado_em',          u.created_at,
        'foto', CASE
                  WHEN COALESCE(u.photo_url,'') = '' THEN NULL
                  WHEN u.photo_url ILIKE '%drive.google.com%' THEN NULL
                  WHEN u.photo_url LIKE 'http%' THEN u.photo_url
                  ELSE v_base || u.photo_url
                END
      ) ORDER BY u.created_at DESC)
      FROM uniq u
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.talents_resumo_candidatos_semana(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.talents_resumo_candidatos_semana(integer) TO service_role;
