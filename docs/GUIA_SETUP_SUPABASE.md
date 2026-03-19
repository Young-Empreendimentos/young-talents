# 🔧 Guia de Setup Supabase - Young Talents

Este guia explica como configurar o Supabase para o projeto Young Talents.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto Supabase criado
3. Acesso ao dashboard do Supabase

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha:
   - **Name**: `young-talents` (ou outro nome de sua escolha)
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
4. Clique em "Create new project"

### 2. Executar Migrations SQL

1. No dashboard do Supabase, vá em **SQL Editor**
2. Execute os arquivos em `supabase/migrations/` **na ordem numérica**:
   - `000_verify_setup.sql`
   - `001_create_schema.sql` → `002_create_candidates_table.sql` → `003_create_user_roles_table.sql`
   - `004_add_initial_user_roles.sql` → `005_grant_anon_young_talents.sql` → `006_public_candidates_view.sql`
   - `007_tables_master_and_jobs.sql` → `008_applications.sql` → `009_seed_initial_data.sql`
   - `010_public_user_roles_view.sql` → `011_allow_duplicate_candidate_emails.sql` → `012_expose_young_talents_for_api.sql`
   - `013_job_levels_and_activity_areas.sql` → `014_activity_log.sql` → `015_add_deleted_at_to_candidates.sql` e `015_populate_cities_rs.sql`
- `016_allow_null_user_id.sql` → `017_sync_user_role_on_login.sql` → `018_update_rls_for_devs.sql`
- `019_add_approved_by_to_jobs.sql` → `020_add_posting_channels_to_jobs.sql` → `021_add_starred_to_candidates.sql`
- `022_add_candidate_process_columns.sql` → `023_fix_rls_vulnerabilities.sql`
- `024_rls_full_access_developer.sql` → `025_rls_grant_execute_is_developer.sql`
- `026_rls_dev_user_id_explicit.sql` → `027_is_developer_never_throws.sql` → `028_fix_user_roles_rls_recursion.sql`
- `029_is_developer_no_auth_users.sql` → `030_fix_user_roles_select_policy_no_auth_users.sql` → `031_dev_contato_eduardo_full_access.sql`
- `032_promote_young_gestores_to_editor.sql` → `033_add_requested_by_user_id_to_jobs.sql`
- `034_ensure_young_gestores_editor_yt08.sql` → `035_sync_user_roles_user_id_and_application_access_yt10.sql`

**Importante:** A migration `012_expose_young_talents_for_api.sql` expõe o schema `young_talents` no PostgREST (necessário para o frontend). Se usar apenas o SQL Editor, execute também o conteúdo dessa migration.

### 3. Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon public** key → será `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → será `SUPABASE_SERVICE_ROLE_KEY` (apenas para scripts)

### 4. Configurar Variáveis de Ambiente

#### Local (.env.local)

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

#### Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto `young-talents`
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - `VITE_SUPABASE_URL` → URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` → Anon key do Supabase
5. Configure para **Production**, **Preview** e **Development**
6. Clique em **Save**

### 5. Criar Usuários Iniciais

1. Configure a variável `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
2. Execute o script:

```bash
node scripts/setup-supabase-users.js
```

Este script criará os seguintes usuários:
- `contato@adventurelabs.com.br` - admin (senha: admin123)
- `suelen@youngempreendimentos.com.br` - admin (senha provisória: temp123)
- `carla@youngempreendimentos.com.br` - editor (senha provisória: temp123)
- `rodrigo@youngempreendimentos.com.br` - admin (senha provisória: temp123)
- `eduardo@youngempreendimentos.com.br` - admin (senha provisória: temp123)

### 6. Configurar Google OAuth (Opcional)

Para habilitar login com Google:

1. No dashboard do Supabase, vá em **Authentication** → **Providers**
2. Ative **Google**
3. Configure:
   - **Client ID**: Obtenha no [Google Cloud Console](https://console.cloud.google.com)
   - **Client Secret**: Obtenha no Google Cloud Console
4. Adicione a URL de redirecionamento:
   - `https://seu-projeto.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (para desenvolvimento)

### 7. Verificar Configuração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:5173`
3. Tente fazer login com um dos usuários criados
4. Verifique se o formulário público funciona em `/apply`

## 🔒 Segurança

### Row Level Security (RLS)

As políticas RLS estão configuradas para:
- **candidates**: Leitura para autenticados, escrita para admin/editor
- **user_roles**: Leitura própria, escrita apenas para admin
- **Formulário público**: Permite inserção anônima (apenas para candidates)

### Service Role Key

⚠️ **IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` tem acesso total ao banco de dados.
- **NUNCA** exponha esta chave no frontend
- **NUNCA** commite no repositório
- Use apenas em scripts server-side ou backend

## 📝 Estrutura do Schema

O projeto usa o schema `young_talents`:

- `young_talents.candidates` - Candidatos
- `young_talents.user_roles` - Roles (admin, editor, viewer)
- `young_talents.jobs`, `companies`, `cities`, `positions`, `sectors` - Dados mestres e vagas
- `young_talents.applications` - Candidaturas (candidato × vaga)
- `young_talents.activity_log` - Histórico de ações
- Views públicas e políticas RLS conforme as migrations.

## 🐛 Troubleshooting

### Erro: "relation does not exist"

- Verifique se as migrations foram executadas
- Confirme que o schema `young_talents` existe

### Erro: "permission denied"

- Verifique as políticas RLS
- Confirme que o usuário está autenticado
- Verifique se o usuário tem a role correta

### Erro: "invalid api key"

- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos
- Confirme que as variáveis estão configuradas no Vercel

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
