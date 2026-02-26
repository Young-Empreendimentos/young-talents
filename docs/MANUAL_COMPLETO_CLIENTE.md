# Manual Completo - Young Talents ATS

**Versão:** 1.2  
**Data:** Fevereiro 2026

Este manual reúne uso, manutenção e credenciais para o sistema Young Talents ATS. Destina-se ao cliente/tenant que opera o aplicativo.

> **Novidades recentes:** Filtro “em consideração” (3 opções), estrela em qualquer etapa, mensagens em português, salvar vaga sem “Quem autorizou”, botão Atualizar, log de movimentações na aba Administrativo. Ver [NOVAS_FUNCIONALIDADES_E_AJUSTES.md](./NOVAS_FUNCIONALIDADES_E_AJUSTES.md).

---

## Índice

1. [Credenciais e Links de Acesso](#1-credenciais-e-links-de-acesso)
2. [Visão Geral](#2-visão-geral)
3. [Arquitetura e Stack](#3-arquitetura-e-stack)
4. [Rotas e URLs](#4-rotas-e-urls)
5. [Mapa do Site](#5-mapa-do-site)
6. [Funcionalidades por Módulo](#6-funcionalidades-por-módulo)
7. [Campos e Mapeamento (API)](#7-campos-e-mapeamento-api)
8. [Manutenção](#8-manutenção)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Credenciais e Links de Acesso

**Importante:** Para obter as credenciais abaixo, entre em contato com o desenvolvedor responsável.

| Serviço | URL | Login/Acesso |
|---------|-----|--------------|
| **URL do App** | [OBTER COM DESENVOLVEDOR] | - |
| **Supabase Dashboard** | https://app.supabase.com | [OBTER COM DESENVOLVEDOR] |
| **Vercel Dashboard** | https://vercel.com/dashboard | [OBTER COM DESENVOLVEDOR] |
| **GitHub** | [URL DO REPOSITÓRIO] | [OBTER COM DESENVOLVEDOR] |

### Credenciais técnicas (solicitar ao desenvolvedor)

- **Senha admin inicial / usuários provisórios:** [OBTER COM DESENVOLVEDOR]
- **SUPABASE_SERVICE_ROLE_KEY** (apenas para scripts; nunca expor no frontend): [OBTER COM DESENVOLVEDOR]
- **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY:** [OBTER COM DESENVOLVEDOR]

---

## 2. Visão Geral

### Introdução

O **Young Talents ATS** é um sistema completo de gerenciamento de recrutamento (Applicant Tracking System) que permite à sua empresa gerir candidatos, vagas e todo o processo seletivo em um único lugar.

### Para que serve

- Centralizar candidatos vindos do formulário público ou importação
- Visualizar o processo seletivo em um pipeline Kanban (arrastar e soltar)
- Criar e gerenciar vagas, empresas, cargos e setores
- Vincular candidatos a vagas específicas
- Agendar entrevistas e acompanhar etapas
- Gerar relatórios e métricas
- Importar candidatos via CSV

### Primeiros passos

1. Acesse a URL do sistema fornecida pelo administrador
2. Clique em **Entrar com Google** ou use email/senha
3. Após o login, você será redirecionado para o Dashboard
4. Use o menu lateral para navegar entre as seções

---

## 3. Arquitetura e Stack

### Stack tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18 | Frontend UI |
| Vite | 5 | Build e dev server |
| Supabase | - | Backend (PostgreSQL, Auth, RLS) |
| Tailwind CSS | 3 | Estilos |
| Recharts | 2 | Gráficos do dashboard |
| Lucide React | - | Ícones |

### Estrutura do projeto

```
young-talents/
├── src/                    # Código frontend
│   ├── App.jsx             # App principal e estado global
│   ├── main.jsx            # Entry point
│   ├── supabase.js         # Cliente Supabase
│   ├── constants.js        # Constantes (Pipeline, campos, cores)
│   ├── components/         # Componentes React
│   ├── features/           # Módulos (Dashboard)
│   ├── routes/             # Rotas e layout
│   ├── utils/              # Utilitários e normalizadores
│   └── index.css           # Estilos globais e tema
├── supabase/
│   ├── migrations/         # SQL do schema (young_talents)
│   └── functions/          # Edge Functions
├── scripts/                # Scripts CLI
├── docs/                   # Documentação
└── assets/                 # Arquivos estáticos
```

### Fluxo de dados

O app consome dados do Supabase (PostgreSQL) via cliente JavaScript. O schema principal é `young_talents`. Autenticação via Supabase Auth (Google OAuth e email/senha). RLS (Row Level Security) controla o acesso aos dados por usuário/role.

---

## 4. Rotas e URLs

### Rotas públicas (sem autenticação)

| Rota | Descrição |
|------|-----------|
| `/apply` | Formulário público de candidatos |
| `/apply/thank-you` | Página de agradecimento após envio |

### Rotas autenticadas

| Rota | Descrição |
|------|-----------|
| `/` | Redireciona para /dashboard |
| `/login` | Página de login |
| `/dashboard` | Dashboard com KPIs e gráficos |
| `/pipeline` | Pipeline Kanban |
| `/candidates` | Banco de Talentos |
| `/jobs` | Gestão de Vagas |
| `/applications` | Candidaturas |
| `/companies`, `/positions`, `/sectors`, `/cities` | Dados mestres |
| `/reports` | Relatórios |
| `/help` | Documentação |
| `/settings` | Configurações |
| `/candidate/:id` | Perfil do candidato |

### Query parameters

- `modal=job` – Modal de vaga
- `modal=job-candidates&id=xxx` – Candidatos da vaga
- `modal=csv` – Importação CSV
- `settingsTab=campos|pipeline|empresas|usuarios|historico|emails` – Aba em Configurações

---

## 5. Mapa do Site

| Página | Função |
|--------|--------|
| **Dashboard** | KPIs, gráficos por status/cidade/fonte/área, evolução mensal. Clique nos KPIs para filtrar candidatos. |
| **Pipeline** | Kanban do processo: Inscrito → Considerado → Entrevista I → Testes → Entrevista II → Seleção → Contratado/Reprovado/Desistiu |
| **Banco de Talentos** | Tabela completa, busca, filtros avançados, ordenação, paginação |
| **Formulários Recebidos** | Submissões do formulário público (/apply) |
| **Vagas** | Gerenciar Vagas, Candidaturas, Empresas, Cargos, Setores, Cidades |
| **Relatórios** | Relatórios e análises |
| **Configurações** | Campos, Pipeline, Empresas/Unidades, Importar/Exportar, Histórico, Usuários |

---

## 6. Funcionalidades por Módulo

### Candidatos

- **Buscar:** barra de busca (nome, email, telefone, cidade, fonte, área, formação)
- **Filtrar:** Filtros Avançados – Período, Status, Vaga, Cidade, Área, Fonte, etc.
- **Ordenar:** clique no cabeçalho da coluna
- **Adicionar:** botão Adicionar → preencher abas → Salvar
- **Avançar etapa:** abra o candidato → Avançar Etapa do Processo → escolha a próxima etapa
- **Importar CSV:** Configurações → Importar/Exportar → baixe modelo → mapeie colunas → confirme

### Vagas

- Criar e editar vagas (empresa, cargo, setor, cidade, descrição, requisitos)
- Visualizar por Status, Cidade, Empresa ou Período
- Vincular candidatos a vagas via Candidaturas

### Formulário público

- URL: `/apply`
- Candidatos não autenticados preenchem e enviam
- Submissões aparecem em Formulários Recebidos

### Filtros

- Período (Data Cadastro Original), status, vaga, cidade, área, fonte, escolaridade, tags
- Persistem em localStorage

### Importação

- CSV ou XLSX
- Mapeamento de colunas para campos do sistema
- Opções de duplicação por email
- CLI: `npm run import-candidates`

---

## 7. Campos e Mapeamento (API)

Cada entidade usa um mapeamento padronizado: **key** (nome no sistema/API), **displayName** (rótulo visual), **csvLabel** (coluna no CSV/Sheets), **type** (tipo de dado). Útil para integrações futuras via API.

### CANDIDATE_FIELDS (principais)

| key | displayName | type |
|-----|-------------|------|
| fullName | Nome | text |
| email | Email | email |
| phone | Telefone | phone |
| city | Cidade | select |
| birthDate | Data Nasc. | date |
| age | Idade | number |
| maritalStatus | Estado Civil | select |
| education | Formação | text |
| experience | Experiência | textarea |
| interestAreas | Área de Interesse | select |
| status | Status | select |
| ... | ... | ... |

### JOB_FIELDS (principais)

| key | displayName | type |
|-----|-------------|------|
| title | Título da Vaga | text |
| company | Empresa/Unidade | select |
| city | Cidade | select |
| interestArea | Área | select |
| sector | Setor | select |
| position | Cargo | select |
| description | Descrição | textarea |
| requirements | Requisitos | textarea |
| status | Status | select |
| ... | ... | ... |

### APPLICATION_FIELDS

| key | displayName |
|-----|-------------|
| candidateId | Candidato |
| jobId | Vaga |
| status | Status |
| appliedAt | Data da Candidatura |
| notes | Notas |
| rating | Avaliação |

---

## 8. Manutenção

### Scripts CLI

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run import-candidates` | Importar candidatos de assets/candidates/candidates.csv |
| `npm run sync-candidates-csv` | Excluir todos e reimportar do CSV |
| `node scripts/setup-supabase-users.js` | Criar usuários iniciais |
| `node scripts/create-admin-user.js` | Criar usuário admin |

### Migrations Supabase

Execute os arquivos em `supabase/migrations/` na ordem numérica via SQL Editor do Supabase. Consulte docs/GUIA_SETUP_SUPABASE.md.

### Variáveis de ambiente

Crie `.env.local`:

```
VITE_SUPABASE_URL=[OBTER COM DESENVOLVEDOR]
VITE_SUPABASE_ANON_KEY=[OBTER COM DESENVOLVEDOR]
SUPABASE_SERVICE_ROLE_KEY=[OBTER COM DESENVOLVEDOR]
```

### Backup

Consulte docs/GUIA_BACKUP_SUPABASE.md. Supabase Dashboard oferece backups automáticos conforme o plano.

---

## 9. Troubleshooting

### Filtros de período não funcionam

- Verifique se os candidatos têm "Data de Cadastro" preenchida
- A coluna deve estar visível na tabela

### Candidato não aparece após importação

- Verifique se foi marcado como duplicado e ignorado
- Confira os filtros aplicados
- Consulte Histórico de Ações (Configurações)

### Não consigo criar vaga sem empresa

- Crie a empresa em Configurações → Empresas/Unidades
- Ou use o botão "Nova" no formulário de vaga

### Dados não estão normalizados

- O sistema normaliza ao salvar
- Edite manualmente ou reimporte para dados antigos

### Erro ao criar usuário (email e senha)

- Edge Function `create-user` precisa estar deployada
- Consulte docs/GUIA_CRIAR_USUARIO_ADMIN.md

### Login não funciona

- Consulte docs/TROUBLESHOOTING_LOGIN.md
- Verifique variáveis de ambiente (Vercel/local)

### Alternar tema (Dark/Light)

- Clique no ícone de sol/lua no canto superior direito
- A preferência é salva automaticamente

---

## Suporte

1. Consulte este manual
2. Consulte a seção **Ajuda** no app (menu lateral)
3. Verifique **Histórico de Ações** para operações recentes
4. Entre em contato com o administrador do sistema
5. Para credenciais e acessos técnicos: **solicite ao desenvolvedor responsável**

---

*Documento gerado para exportação ao Google Docs. Preencha os campos [OBTER COM DESENVOLVEDOR] com as credenciais fornecidas.*
