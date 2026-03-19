# Segurança: RLS, roles e auth (Young Talents)

## Causa raiz (corrigida em `037_restrict_read_to_staff_roles.sql`)

- Várias tabelas tinham políticas **`FOR SELECT TO authenticated USING (true)`** (candidatos, candidaturas, empresas, cidades, vagas, etc.).
- Com isso, **qualquer usuário com sessão válida no Supabase** lia todos os dados, independentemente de `user_roles`.
- O trigger `sync_user_role_on_login` ([`017_sync_user_role_on_login.sql`](../supabase/migrations/017_sync_user_role_on_login.sql)) ainda cria **`viewer`** para quem entra sem linha prévia — se o cadastro/login for aberto, um atacante vira `viewer` e, com `USING (true)`, enxergava o banco inteiro.

## O que a migration 037 faz

- Função **`young_talents.has_staff_access()`** (SECURITY DEFINER): retorna true se existir linha em `young_talents.user_roles` com `role IN ('admin','editor','viewer')`, casando por `user_id = auth.uid()` ou por **email do JWT** quando `user_id` é NULL (mesmo padrão de [`035_sync_user_roles_user_id_and_application_access_yt10.sql`](../supabase/migrations/035_sync_user_roles_user_id_and_application_access_yt10.sql)).
- Substitui os **SELECT** abertos nas tabelas staff do schema `young_talents` por `USING (has_staff_access())`.
- **`REVOKE` para `anon`**: remove `SELECT`/`UPDATE`/`DELETE` em `public.candidates` e `public.user_roles` e `SELECT` em `young_talents.candidates` para o papel anônimo — o formulário público continua só com **INSERT** onde já existir política/grant adequado.

## Frontend ([`src/App.jsx`](../src/App.jsx))

- O fallback **`userRoleDoc?.role || 'admin'`** era perigoso (usuário sem match na lista era tratado como admin na UI).
- Alterado para **`'viewer'`** quando não houver linha correspondente.

## `user_roles` “duplicado”

- **`young_talents.user_roles`** é a tabela canônica.
- **`public.user_roles`** é **view** sobre ela ([`010_public_user_roles_view.sql`](../supabase/migrations/010_public_user_roles_view.sql)), para o client PostgREST usar o schema `public` por padrão — não é segunda fonte de verdade.

## Roles esperados pelo sistema

| Role     | Uso |
|----------|-----|
| `admin`  | Tudo + gestão de usuários / log (conforme RLS) |
| `editor` | Operação (candidatos, pipeline, vagas, mestres conforme políticas) |
| `viewer` | Somente leitura na UI; com 037, **só lê dados se tiver linha em `user_roles`** |

Alinhar labels em [`src/components/SettingsPage.jsx`](../src/components/SettingsPage.jsx) com esses três valores.

## Recomendações operacionais (além do RLS)

1. **Supabase Auth**: desabilitar auto-cadastro público ou restringir domínios, se só colaboradores Young devem entrar.
2. **Alternativa**: parar de criar `viewer` automaticamente no trigger para emails não pré-cadastrados (exige fluxo de convite/admin) — mudança de produto; avaliar antes.
3. **Clerk + Supabase**: manter dados no Postgres; usar JWT do Clerk assinado com o segredo configurado no Supabase (third-party auth) e garantir claims **`sub`** (mapeado para o usuário) e **`email`** para políticas que usam `auth.jwt() ->> 'email'`. Documentação: [Supabase Custom JWT / Third-party auth](https://supabase.com/docs/guides/auth/third-party/overview).

## Aplicar no projeto remoto

```bash
cd young-talents
supabase link --project-ref ttvwfocuftsvyziecjeu   # se ainda não linkado
supabase db push
```

Validar com usuário de teste **sem** linha em `user_roles` (não deve ver candidatos) e com `viewer`/`editor`/`admin`.
