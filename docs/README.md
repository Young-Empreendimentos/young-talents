# 📚 Documentação - Young Talents ATS

Índice da documentação ativa. O ATS usa **Supabase** (não Firebase).

## Na raiz do projeto

| Documento | Uso |
|-----------|-----|
| [README.md](../README.md) | Visão geral, quick start, stack |
| [DOCUMENTACAO_ADMIN.md](../DOCUMENTACAO_ADMIN.md) | Documentação técnica para administradores |
| [GUIA_USO_APP.md](../GUIA_USO_APP.md) | Guia canônico para usuários do app |

## Nesta pasta (`docs/`)

| Documento | Uso |
|-----------|-----|
| [MANUAL_COMPLETO_CLIENTE.md](./MANUAL_COMPLETO_CLIENTE.md) | Manual principal do cliente (uso, manutenção, credenciais) |
| [NOVAS_FUNCIONALIDADES_E_AJUSTES.md](./NOVAS_FUNCIONALIDADES_E_AJUSTES.md) | Novidades e ajustes para o usuário final (Fev/2026) |
| [GUIA_SETUP_SUPABASE.md](./GUIA_SETUP_SUPABASE.md) | Setup do Supabase (migrations, credenciais, OAuth) |
| [GUIA_CRIAR_USUARIO_ADMIN.md](./GUIA_CRIAR_USUARIO_ADMIN.md) | Criar admin (script, Dashboard, Edge Function) |
| [LOGIN_SEM_EXPOR_CREDENCIAIS.md](./LOGIN_SEM_EXPOR_CREDENCIAIS.md) | Login sem expor usuário/senha (OAuth, Magic Link, arquivo local) |
| [GUIA_IMPORTACAO_CSV.md](./GUIA_IMPORTACAO_CSV.md) | Importação CSV/XLSX pelo frontend |
| [GUIA_NORMALIZACAO_CIDADES.md](./GUIA_NORMALIZACAO_CIDADES.md) | Regras de normalização de cidades |
| [CHECKLIST_PRE_DEPLOY.md](./CHECKLIST_PRE_DEPLOY.md) | Checklist antes do deploy |
| [CONFIGURACAO_VERCEL.md](./CONFIGURACAO_VERCEL.md) | Variáveis de ambiente no Vercel |
| [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) | Problemas de login (Supabase Auth) |
| [README_USUARIO.md](./README_USUARIO.md) | Guia detalhado para usuários finais |
| [REVISAO_SQL.md](./REVISAO_SQL.md) | Revisão de scripts SQL |
| [ROTAS_E_NAVEGACAO.md](./ROTAS_E_NAVEGACAO.md) | Rotas, slugs e query params |
| [GUIA_BACKUP_SUPABASE.md](./GUIA_BACKUP_SUPABASE.md) | Backup do banco Supabase |
| [IMPORTAR_CSV_CANDIDATOS.md](./IMPORTAR_CSV_CANDIDATOS.md) | Importar candidatos via script (CSV → Supabase) |
| [SEED_CANDIDATOS_CLI.md](./SEED_CANDIDATOS_CLI.md) | Seed de candidatos via CLI |
| [TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md) | Problemas de deploy |
| [TROUBLESHOOTING_SCHEMA.md](./TROUBLESHOOTING_SCHEMA.md) | Problemas de schema Supabase |
| [RLS_E_DESENVOLVEDORES.md](./RLS_E_DESENVOLVEDORES.md) | RLS e usuários desenvolvedores (dev, contato@, eduardo@); migrations 024–035; como aplicar |
| [DIAGNOSTICO_SUPABASE.md](./DIAGNOSTICO_SUPABASE.md) | Como rodar o diagnóstico SQL/Node do Supabase |

## C-suite / base de conhecimento

A documentação de referência para a liderança (acesso desenvolvedores, Supabase, RLS) está na **base de conhecimento** do monorepo: `knowledge/06_CONHECIMENTO/young-talents-acesso-desenvolvedores-supabase.md`. Consumida pela API `/api/csuite/context-docs` e pelo /admin.

## Futuras melhorias

A pasta [futuras-melhorias/](./futuras-melhorias/) reúne planejamentos e especificações de funcionalidades **ainda não implementadas**, para consulta nas próximas etapas do projeto.

## Arquivado

A pasta [arquivado/](./arquivado/) contém documentação **obsoleta** (Firebase, Firestore, Google Forms, Apps Script) e planejamentos **não implementados**. Ver [arquivado/README.md](./arquivado/README.md) para a lista.
