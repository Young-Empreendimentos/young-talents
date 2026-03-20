# React + Vite

# 🏆 Young Talents ATS

> **Nota (monorepo):** o app Supabase canônico vive em **`apps/clientes/young-talents/plataforma`**. Este diretório em `clients/04_young/` mantém espelho de SQL/docs. Modelo de segurança (sem segredos): `wiki/Young-Talents-ATS-Seguranca.md` e `docs/young-talents/sql/README.md` na raiz do monorepo.

Sistema de Gerenciamento de Recrutamento (ATS - Applicant Tracking System) desenvolvido com React + Vite + Supabase.

## 📋 Funcionalidades Principais

### 🎯 Gestão de Candidatos
- **Pipeline Kanban**: Visualização em colunas com drag & drop para mover candidatos entre etapas
- **Banco de Talentos**: Tabela completa com todas as informações dos candidatos
  - Colunas: Nome, Email, Telefone, Cidade, Fonte, Áreas de Interesse, Formação, Escolaridade, CNH, Status, Data de Cadastro
  - Busca em tempo real por múltiplos campos
  - Ordenação por qualquer coluna (clique no cabeçalho)
  - Paginação configurável (5, 10, 25, 50, 100, 500, 1000 itens por página)
- **Filtros Avançados**: 
  - Período (últimos 7/30/90 dias ou personalizado)
  - Status/Etapa da Pipeline (seleção múltipla)
  - Vaga vinculada (seleção múltipla)
  - Cidade (seleção múltipla com busca por texto)
  - Área de Interesse (seleção múltipla com busca por texto)
  - Fonte/Origem (seleção múltipla com busca por texto)
  - Escolaridade (seleção múltipla, ordenado alfabeticamente)
  - Estado Civil (seleção múltipla, ordenado alfabeticamente)
  - CNH (Sim/Não)
- **Menu de Avanço de Etapa**: Menu destacado na primeira aba do formulário de candidato para avançar etapas rapidamente
- **Normalização Inteligente**: Padronização automática de cidades, fontes e áreas de interesse

### 💼 Gestão de Vagas
- **Cadastro Completo**: Título, Empresa, Cidade, Área de Interesse, Status, Tipo, Faixa Salarial, Descrição, Requisitos
- **Vincular a Base**: Empresas, Cidades e Áreas de Interesse vinculadas às collections do sistema
- **Visualização por Abas**: 
  - Por Status (Aberta, Preenchida, Cancelada, Fechada)
  - Por Cidade
  - Por Empresa
  - Por Período (data de criação)
- **Candidatos Vinculados**: Visualizar quantos candidatos estão associados a cada vaga

### 🏢 Gestão de Empresas/Unidades
- **CRUD Completo**: Criar, editar e excluir empresas
- **Campos**: Nome, Cidade, Área de Interesse, Endereço, Telefone, Email
- **Integração**: Empresas cadastradas aparecem automaticamente no cadastro de vagas

### 📊 Dashboard
- **KPIs Principais**: Total de Candidatos, Contratados, Vagas Abertas, Reprovados
- **Gráficos Interativos**:
  - Candidatos por Status (Pizza)
  - Candidatos por Cidade (Barras)
  - Candidatos por Fonte/Origem (Barras)
  - Candidatos por Área de Interesse (Barras)
  - Candidatos por Mês (Linha)
- **Responsivo**: Gráficos adaptáveis com legendas e tooltips melhorados

### 📥 Importação e Exportação
- **Importação CSV/XLSX**:
  - Download de modelo (CSV ou XLSX) com 3 linhas de exemplo
  - Mapeamento inteligente de colunas com auto-detecção
  - Revisão de vínculos antes da importação
  - Opções de duplicação: Pular (manter atual), Substituir/Atualizar, Duplicar
  - Tags de importação automáticas (nome do arquivo + data + hora) ou personalizadas
  - Normalização automática de cidades, fontes e áreas de interesse
- **Exportação**: Exportar candidatos ou vagas em formato CSV ou Excel (XLSX)

### ⚙️ Configurações
- **Gerenciamento de Campos**: 
  - Seções separadas para Campos do Candidato e Campos da Vaga
  - Toggle de visibilidade e obrigatoriedade (funcional)
  - Busca de campos
- **Configuração do Pipeline**: 
  - Adicionar, editar e remover etapas do funil
  - Gerenciar motivos de perda
- **Empresas/Unidades**: Gerenciamento completo de empresas
- **Histórico de Ações**: Registro de todas as ações em massa (importações, exportações, exclusões)
- **Usuários**: Gerenciamento de usuários do sistema (em desenvolvimento)
- **Modelos de Email**: Templates de email automáticos (em desenvolvimento)

### 🎨 Interface e UX
- **Tema Dark/Light**: Toggle com persistência e suporte completo
- **Design Universal**: Cores padrão (blue/gray) para melhor contraste e legibilidade
- **Responsivo**: Otimizado para desktop, tablet e mobile
- **URLs Compartilháveis**: Cada página e modal tem URL única para compartilhamento
- **Paginação**: Implementada em Pipeline (Kanban e Lista) e Banco de Talentos
- **Soft Delete**: Exclusão lógica com preservação de dados
- **Histórico de Ações**: Rastreamento completo de modificações por usuário

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação

\`\`\`bash
# Clone o monorepo ou o repositório interno da sua organização
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>

# Instale dependências
npm install

# Configure variáveis de ambiente
# Crie um arquivo .env.local com as credenciais do Supabase:
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Inicie o servidor de desenvolvimento
npm run dev
\`\`\`

Acesse \`http://localhost:5173\`

## 📦 Build e Deploy

\`\`\`bash
# Build para produção
npm run build

# Preview do build
npm run preview
\`\`\`

### Deploy no Vercel

1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Adicione variáveis de ambiente no dashboard:
	- \`VITE_SUPABASE_URL\` - URL do seu projeto Supabase
	- \`VITE_SUPABASE_ANON_KEY\` - Anon key do Supabase
3. Clique em "Deploy"

## 🔐 Configuração Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations SQL (veja `supabase/migrations/`)
3. Configure Google OAuth (opcional) no dashboard do Supabase
4. Crie um arquivo \`.env.local\`:

\`\`\`env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
\`\`\`

5. Execute o script para criar usuários iniciais:
\`\`\`bash
node scripts/setup-supabase-users.js
\`\`\`

📖 **Guia completo**: Veja [GUIA_SETUP_SUPABASE.md](./GUIA_SETUP_SUPABASE.md) para instruções detalhadas.

## 🌐 Rotas principais

- **`/apply`** — formulário público (anon)
- **`/login`** — staff cadastrado em `user_roles`

**Produção:** defina domínio e Redirect URLs no Supabase no ambiente real — **não** versione URLs fixas de cliente neste README (clone seguro).

## 📚 Documentação

### 📖 Para Usuários Finais
- [README_USUARIO.md](./README_USUARIO.md) - **Guia completo do usuário** - Como usar todas as funcionalidades do sistema

### 🔧 Para Desenvolvedores / Administradores

#### Navegação e Rotas
- [docs/ROTAS_E_NAVEGACAO.md](./docs/ROTAS_E_NAVEGACAO.md) - **Guia completo de rotas e navegação** - Todas as URLs e slugs do sistema

#### Configuração e Integração
- [GUIA_APPS_SCRIPT.md](./GUIA_APPS_SCRIPT.md) - **Configuração do Google Apps Script** (Forms → Firebase)
  - Script oficial: `assets/.APPSCRIPT.txt`
  - ⚠️ **Nota:** O arquivo `Code.gs` em `assets/legacy/` é **LEGADO** - não usar
- [GUIA_CRIAR_USUARIO_ADMIN.md](./GUIA_CRIAR_USUARIO_ADMIN.md) - Como criar usuário administrador no Firebase
- [docs/FIREBASE_SECURITY_FORM.md](./docs/FIREBASE_SECURITY_FORM.md) - **Configuração de segurança para formulário público**

#### Importação e Normalização de Dados
- [GUIA_IMPORTACAO_CSV.md](./GUIA_IMPORTACAO_CSV.md) - Guia de importação de dados via CSV/XLSX
- [GUIA_NORMALIZACAO_CIDADES.md](./GUIA_NORMALIZACAO_CIDADES.md) - Regras de normalização de cidades
- [docs/DELETAR_COLEÇÃO_CANDIDATES.md](./docs/DELETAR_COLEÇÃO_CANDIDATES.md) - **Zerar a coleção candidates** no Firestore (antes de reimportar CSV)

#### Deploy e Troubleshooting
- [CONFIGURACAO_VERCEL.md](./CONFIGURACAO_VERCEL.md) - Configuração de variáveis de ambiente no Vercel
- [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) - Solução de problemas de autenticação Google

#### Documentação Arquivada
- [docs/arquivado/](./docs/arquivado/) - Documentos históricos e de teste arquivados

## 🛠️ Scripts Disponíveis

\`\`\`bash
npm run dev             # Servidor de desenvolvimento
npm run build           # Build para produção
npm run preview         # Preview do build
npm run lint            # Verificar linting
npm run delete-candidates   # Excluir todos os docs da coleção candidates (Firestore) — ver docs/DELETAR_COLEÇÃO_CANDIDATES.md
\`\`\`

## 📱 Estrutura do Projeto

\`\`\`
src/
├── App.jsx                      # Aplicação principal com rotas
├── main.jsx                     # Entry point com BrowserRouter
├── firebase.js                  # Configuração centralizada do Firebase
├── constants.js                 # Constantes (Pipeline stages, cores, etc)
├── ThemeContext.jsx             # Context para tema dark/light
├── components/
│   ├── CandidateProfilePage.jsx # Página de perfil do candidato (/candidate/:id)
│   ├── PublicCandidateForm.jsx  # Formulário público de candidatos (/apply)
│   ├── ThankYouPage.jsx          # Página de agradecimento após envio
│   ├── SettingsPage.jsx         # Página de configurações
│   ├── DataManager.jsx          # Gerenciamento de dados base
│   ├── ApplicationsPage.jsx     # Página de candidaturas
│   ├── ReportsPage.jsx          # Página de relatórios
│   ├── HelpPage.jsx             # Página de ajuda
│   └── modals/
│       ├── TransitionModal.jsx          # Modal de transição entre etapas
│       ├── JobsCandidateModal.jsx       # Modal de candidatos de vagas
│       ├── CsvImportModal.jsx           # Modal de importação CSV
│       ├── DashboardCandidatesModal.jsx  # Modal de candidatos do dashboard
│       └── InterviewModal.jsx           # Modal de agendamento de entrevistas
├── utils/                       # Utilitários
│   ├── cityNormalizer.js        # Normalização de cidades
│   ├── interestAreaNormalizer.js # Normalização de áreas de interesse
│   ├── sourceNormalizer.js      # Normalização de fontes
│   ├── validation.js            # Validações de formulários
│   └── matching.js              # Sistema de match candidato-vaga
├── assets/                      # Imagens e assets
└── index.css                    # Estilos globais

assets/
├── .APPSCRIPT.txt               # Script oficial do Google Apps Script
└── legacy/
    └── Code.gs                  # Script legado (não usar)

docs/
├── ROTAS_E_NAVEGACAO.md         # Documentação de rotas e navegação
└── arquivado/                   # Documentação histórica arquivada
\`\`\`

## 🎯 Tecnologias

- **React 18.3** - UI Framework
- **Vite 5.4** - Build tool
- **Firebase 11.0** - Backend e autenticação
- **Recharts 2.13** - Gráficos
- **Tailwind CSS 3.4** - Styling
- **Lucide React 0.460** - Icons

## 🐛 Troubleshooting

### Login Google não funciona
Ver [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md)

### Porta 5173 em uso
\`\`\`bash
npm run dev -- --port 3000
\`\`\`

## 📝 Licença

Proprietário - Young Talents

## 👥 Contribuidores

Equipe Adventure Labs / cliente Young — ver histórico de commits.

## 🔧 Melhorias e Correções Recentes

### ✨ Funcionalidades Adicionadas (v2.2.0)
- ✅ **Formulário Público de Candidatos**: Formulário público (`/apply`) que substitui Google Forms + AppScript
  - Envio direto para Firebase sem dependência de scripts externos
  - Validação e normalização integradas
  - **Recadastro permitido**: aviso se já está no Banco de Talentos, mas permite continuar para atualizar informações
  - **Identidade Young**: logo, cor laranja (#fe5009), fonte Be Vietnam Pro
  - Design responsivo e acessível
  - Página de agradecimento após envio

### ✨ Funcionalidades Adicionadas (v2.1.0)
- ✅ **Página de Perfil do Candidato**: Página dedicada (`/candidate/:id`) com dashboard, abas e histórico completo
- ✅ **Sistema de Match**: Cálculo automático de compatibilidade entre candidatos e vagas
- ✅ **Dashboard Interativo**: Scorecards clicáveis que abrem modais com listas de candidatos
- ✅ **Sistema de Permissões**: Controle de acesso por roles (admin, recruiter, viewer)
- ✅ **Login Email/Senha**: Autenticação tradicional além do Google Login
- ✅ **Filtros Inteligentes**: Busca e seleção em massa para filtros multi-seleção
- ✅ **Data de Criação**: Exibida em tabelas e cards da pipeline
- ✅ **Paginação "Load More"**: Sistema de carregamento progressivo no Kanban
- ✅ **Validação de Movimentação**: Avisos ao tentar mover candidato sem candidatura vinculada
- ✅ **Cidades dos Candidatos**: Priorização de cidades existentes no cadastro de vagas
- ✅ **Gráficos Melhorados**: Animações, gradientes, legendas clicáveis e tooltips com melhor contraste

### ✨ Funcionalidades Anteriores (v2.0.0)
- ✅ **Menu de Avanço de Etapa**: Menu destacado no formulário de candidato para avançar etapas rapidamente
- ✅ **Coluna de Data de Cadastro**: Adicionada na tabela de banco de talentos com ordenação
- ✅ **Cadastro de Empresas Completo**: Com campos de cidade e área de interesse
- ✅ **Filtros de Período**: Funcionando corretamente com campo createdAt
- ✅ **Avisos Visuais**: Badges indicando funcionalidades em desenvolvimento
- ✅ **Melhorias de Contraste**: Cores ajustadas para melhor legibilidade em dark/light mode
- ✅ **Normalização de Dados**: Sistema inteligente para padronizar cidades, fontes e áreas de interesse
- ✅ **Histórico de Ações**: Sistema completo de rastreamento de operações
- ✅ **Exportação de Dados**: Exportação de candidatos e vagas em CSV/XLSX

### 🐛 Correções Recentes
- ✅ **Modal do Dashboard**: Corrigido tela escura ao clicar em scorecards
- ✅ **Timestamps do AppScript**: Melhorada conversão para formato Firestore correto
- ✅ **Leitura de Timestamps**: Suporte para múltiplos formatos do Firebase SDK
- ✅ **Página de Vagas**: Simplificada com botão centralizado e dropdown em vez de abas
- ✅ **Validação de Status**: Avisos ao tentar avançar etapa sem candidatura vinculada
- ✅ **Filtros de Período**: Corrigido funcionamento com campo createdAt
- ✅ **Soft Delete**: Registros deletados não aparecem mais nas listas
- ✅ **Contraste Visual**: Tags, etapas e cabeçalhos com melhor visibilidade
- ✅ **Tabela Completa**: Todas as colunas importantes incluídas
- ✅ **Filtro Padrão de Candidatos**: Corrigido para mostrar todos os candidatos por padrão (não apenas últimos 7 dias)
- ✅ **Módulo Firebase Centralizado**: Criado `src/firebase.js` para evitar inicializações duplicadas
- ✅ **Código de Debug Removido**: Removido código de telemetria que causava erros em produção

---

**Status:** ✅ Pronto para Produção

**Versão:** 2.1.0  
**Última atualização:** Janeiro 2025
