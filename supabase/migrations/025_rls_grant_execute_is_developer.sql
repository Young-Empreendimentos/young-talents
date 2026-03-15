-- ==============================================================================
-- RLS: Garantir que o role authenticated possa executar is_developer() nas políticas
-- Sem isso, a avaliação da política falha e retorna "Permissão negada"
-- ==============================================================================

-- Permite que usuários autenticados executem a função quando as políticas RLS são avaliadas
GRANT EXECUTE ON FUNCTION young_talents.is_developer() TO authenticated;

-- Garantir que a função encontre auth.users (schema auth) ao rodar com SECURITY DEFINER
CREATE OR REPLACE FUNCTION young_talents.is_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (
        'dev@local',
        'dev@adventurelabs.com.br',
        'developer@adventurelabs.com.br'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

COMMENT ON FUNCTION young_talents.is_developer() IS 
  'Verifica se o usuário autenticado é um desenvolvedor (por user_id ou email). Desenvolvedores têm permissões de admin em RLS.';
