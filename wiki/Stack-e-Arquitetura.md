# Stack e arquitetura

## Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 18, React Router 7 |
| Build | Vite 5 |
| Estilo | Tailwind CSS 3 |
| Gráficos | Recharts |
| Backend / Auth / DB | Supabase (Postgres + Auth + Row Level Security) |
| Planilhas | xlsx (import/export) |

## Estrutura de pastas (resumo)

```
src/
  components/          # Páginas e UI (Pipeline, TalentBank, modais…)
  features/dashboard/  # Dashboard
  routes/AppRoutes.jsx # Rotas e layout autenticado
  supabase.js          # Cliente Supabase
  utils/               # Normalização, CSV, validação, matching
supabase/migrations/   # SQL versionado (ordem numérica)
scripts/               # Node: import CSV, roles, seed, diagnóstico
docs/                  # Guias longos (setup, troubleshooting)
```

## Dados

- Schema principal: **`young_talents`** (candidatos, vagas, applications, master tables, activity log, user_roles).  
- Candidatos públicos: fluxo via políticas RLS e views expostas ao PostgREST conforme migrations.  
- **Soft delete:** candidatos com `deleted_at` não aparecem nas listas padrão.

## Auth

- Login e-mail/senha e/ou provedor configurado no Supabase.  
- Papel do usuário em `user_roles`; sincronização no login (migration `017`).  
- Desenvolvedores Adventure: políticas específicas (`018`, `024`, `025`, etc.) — ver doc de RLS no repositório.

## Legado

O repositório ainda menciona Firebase/AppScript em documentos antigos; **a fonte de verdade em produção é Supabase**.
