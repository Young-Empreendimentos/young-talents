# Supabase, migrations e RLS

## Setup

1. Criar projeto no Supabase.  
2. Executar migrations em `supabase/migrations/` **na ordem numérica** (`000` … último arquivo).  
3. Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; scripts administrativos: `SUPABASE_SERVICE_ROLE_KEY` (nunca no frontend).

Guia passo a passo: **`docs/GUIA_SETUP_SUPABASE.md`**.

## Migrations (panorama)

Incluem, entre outras:

- Schema `young_talents`, tabela `candidates`, `user_roles`  
- Views públicas de candidatos e roles  
- Jobs, applications, master data, activity log  
- `deleted_at`, cidades RS, níveis de vaga, canais de divulgação  
- Colunas de processo do candidato, starred, approved_by em jobs  
- Endurecimento e correções de RLS; acesso developer controlado  

**Sempre revisar** migrations novas antes de aplicar em produção.

## RLS e multitenant

Todas as consultas devem respeitar RLS. O projeto Young é **single-tenant** (um cliente); evolções futuras com `tenant_id`/`client_id` devem filtrar explicitamente para não haver vazamento entre clientes.

Documentação adicional no repo: `docs/RLS_E_DESENVOLVEDORES.md`, `docs/RELATORIO_ROLES_E_SECURITY_ADVISOR.md`.

## Edge Functions

Ex.: `supabase/functions/create-user/` — uso conforme deploy e secrets do projeto.
