-- ==============================================================================
-- DIAGNÓSTICO SUPABASE – Young Talents (somente leitura)
-- Cole este script no SQL Editor do projeto e execute. Não altera dados.
-- Projeto esperado: Young Talents (ref ttvwfocuftsvyziecjeu)
-- ==============================================================================

-- 1. TABELAS NO SCHEMA young_talents (e se RLS está ativo)
SELECT
  '1_TABELAS' AS secao,
  c.relname AS tabela,
  CASE WHEN c.relrowsecurity THEN 'SIM' ELSE 'NAO' END AS rls_ativo
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'young_talents'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2. POLÍTICAS RLS POR TABELA
SELECT
  '2_POLITICAS' AS secao,
  schemaname AS schema_name,
  tablename AS tabela,
  policyname AS politica,
  permissive,
  roles,
  cmd AS comando,
  qual AS using_expr,
  with_check AS with_check_expr
FROM pg_policies
WHERE schemaname = 'young_talents'
ORDER BY tablename, policyname;

-- 3. FUNÇÕES is_developer e is_admin (existência e definição)
SELECT
  '3_FUNCOES' AS secao,
  n.nspname AS schema_name,
  p.proname AS funcao,
  pg_get_function_identity_arguments(p.oid) AS argumentos,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'young_talents'
  AND p.proname IN ('is_developer', 'is_admin')
ORDER BY p.proname;

-- 4. GRANTS EXECUTE nas funções young_talents (para authenticated)
SELECT
  '4_GRANTS_FUNCOES' AS secao,
  routine_schema AS schema_name,
  routine_name AS funcao,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'young_talents'
  AND routine_name IN ('is_developer', 'is_admin')
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY routine_name, grantee;

-- 5. USAGE NO SCHEMA young_talents (roles que têm USAGE)
SELECT
  '5_GRANTS_SCHEMA' AS secao,
  'young_talents' AS schema_name,
  r.rolname AS role_name,
  'USAGE' AS privilege
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role')
  AND has_schema_privilege(r.oid, 'young_talents', 'USAGE')
ORDER BY r.rolname;

-- 6. CONTAGEM E LISTA user_roles (user_id, email, role)
SELECT '6_USER_ROLES_CONTAGEM' AS secao, COUNT(*)::text AS total FROM young_talents.user_roles;

SELECT
  '6_USER_ROLES_LISTA' AS secao,
  user_id,
  email,
  role,
  name
FROM young_talents.user_roles
ORDER BY role, email;

-- 7. SCHEMAS EXPOSTOS AO POSTGREST (authenticator)
-- Confirme em Dashboard → Settings → API → Exposed schemas que "young_talents" está listado.
SELECT
  '7_POSTGREST' AS secao,
  CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN 'authenticator existe' ELSE 'authenticator nao encontrado' END AS nota;
