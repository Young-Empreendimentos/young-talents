# Modelo de segurança — Young Talents ATS

Prioridade: **ninguém acessa dados internos do ATS sem cadastro explícito** em `young_talents.user_roles`. Candidatos usam apenas o formulário público **`/apply`** (role `anon`), sem necessidade de login.

## Camadas

1. **Supabase Auth** — Identidade (e-mail/Google/senha). Só isso **não** concede acesso ao CRM.
2. **`young_talents.user_roles`** — Fonte da verdade para staff: `admin`, `editor` ou `viewer` (somente leitura no ATS).
3. **RLS (Postgres)** — Leitura de candidatos, vagas, candidaturas, mestres etc. exige `young_talents.has_privileged_role('viewer')` (ou `is_developer()`). Escrita exige `editor` / `admin` conforme políticas (migration **028** e anteriores).
4. **App (React)** — `hasStaffRole` exige linha em `user_roles` com uma das três roles; `authStaffReady` evita race após OAuth; viewer não vê Configurações.

## Cadastro de usuários da empresa

- **Admin** cria usuários em **Configurações → Usuários** (pré-cadastro por e-mail ou **e-mail + senha** via Edge Function `create-user`).
- Após existir a linha em `user_roles`, o usuário faz login; o trigger **`sync_user_role_on_login`** apenas **preenche `user_id`** e metadados — **não insere** linha nova (migration **028**).

## Candidatos (público)

- **Não** há “login de candidato”. O formulário usa a chave **anon**.
- **INSERT** em candidatos: política existente para `anon`.
- **Não** listar candidatos no cliente: o app usa a RPC **`public.public_candidate_email_exists(p_email)`** só para aviso de duplicidade.
- **Cidades** no formulário: leitura `anon` em `young_talents.cities` (dados não sensíveis).

## Configuração manual no Supabase Dashboard

Recomendado alinhar ao modelo “só entra quem foi cadastrado”:

1. **Authentication → Providers** — Avaliar desativar **sign-up** aberto ou restringir OAuth se não quiser contas órfãs em `auth.users` (RLS já bloqueia dados sem `user_roles`).
2. **Authentication → Email** — Se usar só convite/admin `createUser`, desabilitar “Allow new users to sign up” quando a UI não tiver auto-cadastro.

## Migrations relevantes

| Arquivo | Conteúdo |
|---------|-----------|
| `025_*` | `has_privileged_role` (admin/editor), políticas de escrita, sync com match de e-mail |
| `026_*` | Revoga `anon` em `public.user_roles` |
| `027_*` | `is_developer()` com tratamento de exceção (evita 500 nas políticas) |
| `028_*` | `has_privileged_role('viewer')`, SELECT staff nas tabelas do ATS, RPC duplicidade, anon read cities, revoga SELECT anon em candidates, sync sem INSERT automático, `activity_log` insert só staff |

Deploy: aplicar **028** no projeto Supabase **antes** ou junto do frontend que chama `public_candidate_email_exists` e `schema('young_talents').from('cities')`.
