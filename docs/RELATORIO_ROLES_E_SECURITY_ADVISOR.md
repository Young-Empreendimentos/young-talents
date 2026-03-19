# Relatório: Roles no Young Talents e Security Advisor (Supabase)

Este documento descreve como funcionam as **roles** (papéis) de usuário no sistema e resume os **2 errors** e **32 warnings** reportados pelo Security Advisor do Supabase, com referências às remediações oficiais.

---

## 1. Como funcionam as roles no sistema

### 1.1 Tabela `young_talents.user_roles`

- **Arquivo:** `supabase/migrations/003_create_user_roles_table.sql`
- **Campos:** `id`, `user_id` (FK para `auth.users`), `email`, `name`, `photo`, `role`, `created_at`, `updated_at`, `last_login`
- **Roles permitidos:** `admin`, `editor`, `viewer` (constraint CHECK na coluna `role`)

### 1.2 O que cada role pode fazer

| Role    | Permissões |
|---------|------------|
| **admin**  | CRUD em `user_roles` (criar/editar/excluir usuários e roles); leitura em `activity_log`; leitura e escrita em candidatos, vagas, aplicações, empresas, cidades, setores, cargos, etc. |
| **editor** | Leitura e escrita em candidatos, vagas, aplicações e dados mestres (empresas, cidades, setores, cargos). Não pode gerenciar `user_roles` nem acessar `activity_log` de forma privilegiada. |
| **viewer** | Somente leitura (SELECT) nos dados do app. |

As políticas RLS nas tabelas do schema `young_talents` (candidatos, vagas, aplicações, etc.) permitem acesso a usuários **authenticated** com políticas amplas (ex.: `USING (true)` para authenticated), e a restrição por papel é aplicada principalmente em `user_roles` e `activity_log` (apenas admin para activity_log). Ver `supabase/migrations/002_create_candidates_table.sql`, `007_tables_master_and_jobs.sql`, `014_activity_log.sql`, `018_update_rls_for_devs.sql`.

### 1.3 Sincronização ao login

- **Função:** `young_talents.sync_user_role_on_login`
- **Arquivo:** `supabase/migrations/017_sync_user_role_on_login.sql`
- **Trigger:** Em `auth.users`, após INSERT ou UPDATE (login ou atualização de perfil), o trigger chama essa função.
- **Comportamento:** Se já existir registro em `user_roles` para o e-mail do usuário, atualiza `user_id`, `name`, `photo`, `last_login`. Se não existir, cria um novo registro com role padrão **viewer**.
- **Complemento (YT-10):** a migration `035_sync_user_roles_user_id_and_application_access_yt10.sql` destrava pré-cadastros que ficaram com `user_roles.user_id` como `NULL` ao preencher `user_id` one-off e adicionar `young_talents.is_editor_or_admin()` para permitir INSERT/UPDATE em `young_talents.applications` quando o e-mail do JWT casa com `user_roles.email`.

### 1.4 Bypass para desenvolvedores (is_developer)

- **Função:** `young_talents.is_developer()`
- **Arquivo:** `supabase/migrations/018_update_rls_for_devs.sql`
- **Uso:** Em ambiente controlado, e-mails listados na função têm permissões equivalentes a **admin** em `user_roles` (ler todos, inserir, atualizar, deletar roles), mesmo sem registro em `user_roles`. Util para desenvolvimento e suporte.

### 1.5 Views públicas

- **`public.user_roles`** – Expõe `young_talents.user_roles` para a API (app usa schema `public` por padrão). Arquivo: `supabase/migrations/010_public_user_roles_view.sql`.
- **`public.candidates`** – Expõe `young_talents.candidates` com triggers INSTEAD OF para INSERT/UPDATE/DELETE. Arquivo: `supabase/migrations/006_public_candidates_view.sql`.

---

## 2. Security Advisor: 2 Errors

Os itens abaixo são reportados como **ERROR** (nível crítico).

| # | Nome / Título           | Detalhe | Remediação |
|---|-------------------------|---------|------------|
| 1 | **Security Definer View** | View `public.user_roles` está definida com a propriedade SECURITY DEFINER. | [Documentação Supabase – Database Linter (lint 0010)](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view). Recriar a view com `SECURITY INVOKER` (padrão no PostgreSQL 15+) para que as permissões e RLS sejam aplicadas com o usuário que consulta, não com o dono da view. |
| 2 | **Security Definer View** | View `public.candidates` está definida com a propriedade SECURITY DEFINER. | Mesmo link acima. Para a view `candidates`, as funções de trigger (insert/update/delete) estão definidas como `SECURITY DEFINER`; avaliar recriar a view como INVOKER e ajustar os triggers para não elevar privilégios além do necessário, ou documentar a decisão de manter DEFINER por motivo de compatibilidade com o formulário público (anon). |

**Arquivos envolvidos:**  
`supabase/security/errors.csv`, `supabase/migrations/010_public_user_roles_view.sql`, `supabase/migrations/006_public_candidates_view.sql`.

---

## 3. Security Advisor: 32 Warnings

### 3.1 Function Search Path Mutable (6 itens)

Funções sem `search_path` fixo, o que pode representar risco de busca em esquemas inesperados.

| Função | Schema |
|--------|--------|
| `sync_user_role_on_login` | young_talents |
| `is_developer` | young_talents |
| `update_updated_at_column` | young_talents |
| `candidates_insert_trigger` | public |
| `candidates_update_trigger` | public |
| `candidates_delete_trigger` | public |

**Remediação:** [Database Linter – lint 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable). Em cada função, definir explicitamente o `search_path`, por exemplo:

- `SET search_path = ''` ou  
- `SET search_path = public, young_talents`  

conforme o que a função precisa acessar. Ajustar nas migrations onde as funções são criadas (ex.: `001_create_schema.sql`, `006_public_candidates_view.sql`, `017_sync_user_role_on_login.sql`, `018_update_rls_for_devs.sql`).

### 3.2 RLS Policy Always True (25 itens)

Políticas RLS com `USING (true)` ou `WITH CHECK (true)` em operações **INSERT**, **UPDATE** ou **DELETE**, permitindo acesso amplo para o role indicado (geralmente `authenticated`).

| Tabela (schema young_talents) | Políticas afetadas (exemplos) |
|-------------------------------|--------------------------------|
| activity_areas | Authenticated delete / insert / update |
| applications | Authenticated delete / insert / update |
| candidates | Formulário público pode inserir candidatos (INSERT anon) |
| cities | Authenticated delete / insert / update |
| companies | Authenticated delete / insert / update |
| job_levels | Authenticated delete / insert / update |
| jobs | Authenticated delete / insert / update |
| positions | Authenticated delete / insert / update |
| sectors | Authenticated delete / insert / update |

**Contexto:** No projeto, isso foi adotado de forma intencional para que qualquer usuário autenticado (com login) possa operar nas tabelas de negócio; a restrição por papel (admin/editor/viewer) é aplicada principalmente em `user_roles` e `activity_log`.

**Risco:** Qualquer usuário autenticado pode alterar ou apagar dados dessas tabelas se não houver outra camada de controle (ex.: apenas admin/editor no app).

**Remediação:** [Database Linter – lint 0024](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy). Onde fizer sentido, restringir políticas por role (ex.: checar se existe em `user_roles` com role `admin` ou `editor`) ou por outro critério (ex.: `company_id`, tenant).

### 3.3 Leaked Password Protection Disabled (1 item)

- **Descrição:** A proteção contra senhas vazadas (HaveIBeenPwned) está desativada no Supabase Auth.
- **Remediação:** [Password security – Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Ativar em **Authentication > Settings** no dashboard do Supabase.

---

## 4. Resumo por tipo

| Tipo | Quantidade | Ação sugerida |
|------|------------|----------------|
| **ERROR** (Security Definer View) | 2 | Recriar views com SECURITY INVOKER; revisar triggers da view `candidates`. |
| **WARN** (Function search_path) | 6 | Definir `SET search_path` em todas as funções listadas. |
| **WARN** (RLS policy always true) | 25 | Documentar decisão; opcionalmente restringir por role ou outro critério. |
| **WARN** (Leaked password protection) | 1 | Ativar no dashboard Supabase (Auth > Settings). |
| **Total** | **34** | 2 errors + 32 warnings |

---

## 5. Referência rápida de arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `supabase/security/errors.csv` | Lista dos 2 errors do Security Advisor. |
| `supabase/security/warnings.csv` | Lista dos 32 warnings. |
| `supabase/migrations/003_create_user_roles_table.sql` | Tabela e políticas RLS de `user_roles`. |
| `supabase/migrations/006_public_candidates_view.sql` | View `public.candidates` e triggers. |
| `supabase/migrations/010_public_user_roles_view.sql` | View `public.user_roles`. |
| `supabase/migrations/017_sync_user_role_on_login.sql` | Sincronização de user_roles no login. |
| `supabase/migrations/018_update_rls_for_devs.sql` | Função `is_developer` e políticas de admin. |
| `supabase/migrations/007_tables_master_and_jobs.sql` | Tabelas mestres e jobs (inclui RLS authenticated). |
| `supabase/migrations/014_activity_log.sql` | Activity log e política apenas admin. |
| `supabase/migrations/035_sync_user_roles_user_id_and_application_access_yt10.sql` | YT-10: is_editor_or_admin() e permissão de vínculo em applications. |

Este relatório foi gerado com base no plano de recursos ATS e nos CSVs do Security Advisor do projeto.
