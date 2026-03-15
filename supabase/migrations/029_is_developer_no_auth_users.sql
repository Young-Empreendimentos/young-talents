-- ==============================================================================
-- RLS: is_developer() sem ler auth.users – evita "permission denied for table users"
-- No Supabase o role não tem SELECT em auth.users; a função só usa auth.uid().
-- Dev atual: 6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4 (dev@adventurelabs.com.br).
-- Para outros devs: incluir o UUID aqui ou dar role admin em user_roles.
-- ==============================================================================

CREATE OR REPLACE FUNCTION young_talents.is_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = '6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION young_talents.is_developer() IS 
  'Verifica se o usuário é o desenvolvedor (por user_id). Não acessa auth.users para evitar permission denied.';

GRANT EXECUTE ON FUNCTION young_talents.is_developer() TO authenticated;
