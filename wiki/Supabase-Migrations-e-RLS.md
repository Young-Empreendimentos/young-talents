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

## YT-10 / Migration 035: vincular candidato à vaga

Para a operação de vínculo candidato–vaga em `young_talents.applications`:

- A migration `035_sync_user_roles_user_id_and_application_access_yt10.sql` adiciona a função `young_talents.is_editor_or_admin()`.
- INSERT/UPDATE em `applications` passam a permitir `admin`/`editor` quando:
  - `user_roles.user_id = auth.uid()`, ou
  - `user_roles.user_id` está `NULL`, mas o `email` do JWT (`auth.jwt()->>'email'`) casa com `user_roles.email`.
- Também existe um `UPDATE one-off` na `user_roles` preenchendo `user_id` onde estiver `NULL` e o email existir em `auth.users` (isso destrava pré-cadastros que ainda não fizeram login).

## Edge Functions

Ex.: `supabase/functions/create-user/` — uso conforme deploy e secrets do projeto.
