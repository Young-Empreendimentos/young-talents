# RLS e usuários desenvolvedores (Young Talents)

Este documento descreve as políticas de segurança (RLS) do Supabase no projeto Young Talents e como funcionam os **usuários desenvolvedores**, que têm acesso total às tabelas e roles do schema `young_talents`.

## Quem tem permissão de desenvolvedor

Três usuários têm acesso total (leitura e escrita) a todas as tabelas e à gestão de roles no app:

| E-mail | Nome (user_roles) | Observação |
|--------|-------------------|------------|
| dev@adventurelabs.com.br | Desenvolvedor | Conta técnica |
| contato@adventurelabs.com.br | Adventure Labs | C-suite / contato |
| eduardo@youngempreendimentos.com.br | Eduardo Tebaldi | C-suite / operação |

Eles podem, entre outras coisas:

- Ver e editar **empresas**, **cidades**, **setores**, **cargos**, **vagas**, **candidatos**, **candidaturas**, **áreas de atividade**, **níveis de vaga**
- Ver **log de atividades**
- Gerenciar **usuários e roles** (Configurações no app)

## Como está implementado

- **Função `young_talents.is_developer()`**  
  Retorna verdadeiro quando o usuário logado é um dos três (identificados por `user_id` no Auth). Não acessa a tabela `auth.users` para evitar erro de permissão no Supabase.

- **Políticas RLS**  
  Nas tabelas do `young_talents`, as políticas de INSERT/UPDATE/DELETE permitem acesso se:
  - `young_talents.is_developer()` é verdadeiro, **ou**
  - o usuário tem role **admin** ou **editor** em `young_talents.user_roles`
    (para `user_roles`, via função `is_admin()` onde aplicável; para `applications`, a migration 035 usa `is_editor_or_admin()` com fallback por email quando `user_id` está `NULL`).

- **Políticas explícitas por user_id**  
  Para os três usuários acima existem políticas adicionais que permitem acesso direto por `auth.uid()`, como reforço (migrations 026 e 031).

## Migrations envolvidas (ordem de aplicação)

As alterações estão nas migrations do Supabase. Aplicar no **SQL Editor** do projeto **Young Talents** (ref `ttvwfocuftsvyziecjeu`) na ordem abaixo, se ainda não estiverem aplicadas:

| Migração | Conteúdo |
|----------|----------|
| 024 | `is_developer()` nas políticas de companies, cities, sectors, positions, jobs, job_levels, activity_areas, applications, candidates, activity_log |
| 025 | `GRANT EXECUTE` em `is_developer()` e `search_path` |
| 026 | Políticas explícitas por user_id para dev (6d3c9cde) |
| 027 | `is_developer()` com EXCEPTION para não lançar erro (evitar 500) |
| 028 | Função `is_admin()` e correção de recursão em políticas de `user_roles` |
| 029 | `is_developer()` sem leitura em `auth.users` (evitar "permission denied for table users") |
| 030 | Política "Usuários podem ler seu próprio role" sem leitura em `auth.users` |
| 031 | Inclusão de contato@ e eduardo@ em `is_developer()` e políticas explícitas para ambos |
| 032 | Promoção de young gestores para role `editor` |
| 033 | Preenchimento de `requested_by_user_id` em `jobs` via trigger |
| 034 | Garantia de role `editor` para perfis YT-08 (Young gestores) |
| 035 | YT-10: `is_editor_or_admin()` + políticas em `applications` para permitir vincular mesmo quando `user_roles.user_id` está `NULL` (fallback por email do JWT) |

Arquivos em: `supabase/migrations/024_*` até `035_*`.

## Como aplicar no Supabase

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) e selecione o projeto **Young Talents**.
2. Vá em **SQL Editor**.
3. Para cada migração 024 a 035 (nessa ordem), abra o arquivo `.sql` correspondente no repositório, copie todo o conteúdo, cole no editor e execute (Run).

Não é necessário redeploy do app no Vercel para as mudanças de RLS; basta aplicar o SQL no projeto correto.

## Diagnóstico

- **Script SQL de diagnóstico:** [docs/DIAGNOSTICO_SUPABASE.sql](./DIAGNOSTICO_SUPABASE.sql) — executar no SQL Editor para listar tabelas, políticas RLS, funções e user_roles.
- **Instruções:** [docs/DIAGNOSTICO_SUPABASE.md](./DIAGNOSTICO_SUPABASE.md).
- **Script Node (opcional):** `node scripts/diagnostico-supabase.js` — testa leitura com as credenciais do `.env`.

## Adicionar outro desenvolvedor no futuro

1. Incluir o **user_id** (UUID) do usuário no Auth do projeto Young Talents na função `is_developer()` (migration nova ou alteração da 031).
2. Opcionalmente, criar políticas explícitas por user_id para esse UUID (mesmo padrão da 026/031).
3. Garantir que o usuário exista em `young_talents.user_roles` com role **admin** (via app em Configurações ou inserção direta).

O UUID do usuário pode ser obtido em **Supabase → Authentication → Users** (coluna/id do usuário).

## Referências

- [GUIA_SETUP_SUPABASE.md](./GUIA_SETUP_SUPABASE.md) — setup geral do Supabase.
- [RELATORIO_ROLES_E_SECURITY_ADVISOR.md](./RELATORIO_ROLES_E_SECURITY_ADVISOR.md) — roles e Security Advisor.
- Base de conhecimento (C-suite/admin): `knowledge/06_CONHECIMENTO/young-talents-acesso-desenvolvedores-supabase.md` (no monorepo).
