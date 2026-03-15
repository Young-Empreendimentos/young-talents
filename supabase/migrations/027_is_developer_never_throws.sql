-- ==============================================================================
-- RLS: is_developer() nunca deve lançar exceção – evita 500 ao avaliar políticas.
-- Quando a função lança (ex.: leitura de auth.users), PostgREST retorna 500 e
-- o app exibe "Permissão negada". Com EXCEPTION handler, retornamos FALSE e
-- as políticas que só usam auth.uid() (ex.: 026) continuam permitindo o dev.
-- ==============================================================================

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
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

COMMENT ON FUNCTION young_talents.is_developer() IS 
  'Verifica se o usuário é desenvolvedor (user_id ou email). Nunca lança exceção (retorna FALSE em erro) para evitar 500 nas políticas RLS.';

GRANT EXECUTE ON FUNCTION young_talents.is_developer() TO authenticated;
