# RLS e usuários desenvolvedores (Young Talents)

Descrição **genérica** para clones do repositório. **Não** versionar e-mails reais, UUIDs de produção nem `project-ref` do Supabase nesta documentação.

## Conceito

Alguns projetos definem uma função **`young_talents.is_developer()`** que retorna verdadeiro para contas técnicas (por `auth.uid()` e/ou e-mail), concedendo bypass de RLS alinhado às migrations aplicadas no **seu** banco.

- Quem exatamente é “desenvolvedor” depende das migrations **já aplicadas** no projeto (podem incluir UUIDs fixos ou lista de e-mails).
- O **app canônico** no monorepo é `apps/clientes/young-talents/plataforma` — prefira as migrations dessa pasta como referência para novos deploys.

## Onde está no código

- Arquivos em `supabase/migrations/` com nomes do tipo `024_*`, `025_*`, `026_*`, `is_developer`, etc. (a numeração pode divergir entre `clients/04_young/...` e `plataforma`).
- Políticas RLS nas tabelas do schema `young_talents` que usam `is_developer()` **ou** roles em `user_roles` (`admin` / `editor`).

## Como aplicar ou revisar

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) do **seu** projeto (ref obtido em Settings → General — não colar no Git).
2. Use o **SQL Editor** para inspecionar funções e políticas, ou aplique migrations na ordem definida pelo time.
3. Para **adicionar** um desenvolvedor: criar migration nova que atualize `is_developer()` e, se necessário, políticas por `user_id` — usar o UUID do usuário em **Authentication → Users** (valor operacional, não documentar em README público com identidade real).

## Diagnóstico

- Scripts em `docs/DIAGNOSTICO_SUPABASE.md` / SQL associado (se existirem nesta cópia).
- No monorepo: `docs/young-talents/sql/` para checks de `user_roles` e RLS.

## Referências seguras

- [GUIA_SETUP_SUPABASE.md](./GUIA_SETUP_SUPABASE.md)
- [RELATORIO_ROLES_E_SECURITY_ADVISOR.md](./RELATORIO_ROLES_E_SECURITY_ADVISOR.md)
- Wiki: `wiki/Young-Talents-ATS-Seguranca.md` (raiz do monorepo)
- Base de conhecimento interna (`knowledge/`) pode conter dados operacionais — **não** copiar automaticamente para docs públicos.
