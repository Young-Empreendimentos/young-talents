# Visão geral

## Objetivo

Centralizar o processo seletivo da Young: cadastro de candidatos (formulário público), triagem, pipeline em colunas (Kanban), banco de talentos com filtros avançados, vagas, empresas, candidaturas, relatórios e importação/exportação em massa.

## Perfis de uso

| Perfil | Acesso |
|--------|--------|
| **Candidato** | Apenas `/apply` e página de agradecimento — sem login no Supabase Auth |
| **Recrutador / Editor** | Pipeline, candidatos, vagas conforme RLS e role |
| **Admin** | Configurações, master data, usuários (evolução contínua) |
| **Developer (Adventure)** | Acesso técnico ampliado via políticas RLS dedicadas |

## Módulos principais

1. **Dashboard** — KPIs e gráficos (status, cidade, fonte, área, evolução mensal).  
2. **Pipeline** — Kanban com drag-and-drop entre etapas; lista alternativa.  
3. **Banco de talentos** — Tabela paginada, busca, ordenação, filtros (período, etapa, vaga, cidade, área, fonte, escolaridade, etc.).  
4. **Vagas** — CRUD, canais de divulgação, vínculo com candidatos.  
5. **Candidaturas** — Fluxo formal candidato ↔ vaga.  
6. **Dados mestres** — Empresas, cidades, setores, cargos, etc.  
7. **Configurações** — Campos obrigatórios/visíveis, pipeline customizável, histórico de ações.  
8. **Importação CSV/XLSX** — Mapeamento de colunas, normalização de cidade/fonte/área.

## Identidade visual

Tema claro/escuro, identidade Young (laranja `#fe5009` no fluxo público), responsivo.
