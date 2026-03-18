# Rotas e funcionalidades

## Públicas (sem login)

| Rota | Descrição |
|------|-----------|
| `/apply` | Formulário de candidatura |
| `/apply/thank-you` | Agradecimento pós-envio |

## Autenticadas (layout principal)

| Rota | Módulo |
|------|--------|
| `/` → `/dashboard` | Dashboard |
| `/pipeline` | Kanban / lista pipeline |
| `/candidates` | Banco de talentos |
| `/submissions` | Submissões (quando habilitado) |
| `/jobs` | Gestão de vagas |
| `/applications` | Candidaturas |
| `/companies`, `/positions`, `/sectors`, `/cities` | Master data |
| `/reports` | Relatórios |
| `/documentation` ou rotas de ajuda | Documentação in-app |
| `/settings` | Configurações |
| `/diagnostic` | Diagnóstico (conforme permissão) |
| `/candidate/:id` | Perfil completo do candidato |

## Modais via query string

Exemplos: `?modal=job`, `?modal=csv`, `?modal=job-candidates&id=...`, abas em `/settings?settingsTab=pipeline`.

Detalhes atualizados: arquivo `docs/ROTAS_E_NAVEGACAO.md` no repositório.
