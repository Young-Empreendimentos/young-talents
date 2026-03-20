# ✅ Checklist Pré-Deploy - Young Talents

## 🔍 O que falta antes de commitar, fazer push e deployar

### 1. ⚠️ CRÍTICO: Expor Schema no Supabase

O schema `young_talents` precisa ser exposto no PostgREST para que as queries funcionem.

**Execute este SQL no SQL Editor do Supabase:**

```sql
-- Expor schema young_talents no PostgREST
ALTER DATABASE postgres SET search_path TO public, young_talents;
```

**OU** configure no dashboard:
1. Settings → API → PostgREST
2. Adicione `young_talents` no campo "Extra Search Path"

### 2. ✅ Instalar Dependências

```bash
npm install
```

Isso instalará `@supabase/supabase-js` que foi adicionado ao `package.json`.

### 3. ✅ Executar Script SQL de Roles

Execute `supabase/migrations/004_add_initial_user_roles.sql` no SQL Editor do Supabase para criar as roles dos usuários.

### 4. ⚠️ Configurar Variáveis no Vercel

Antes do deploy, adicione no Vercel Dashboard:

**Settings → Environment Variables:**
- `VITE_SUPABASE_URL` = URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` = Anon key do Supabase

Configure para: **Production**, **Preview** e **Development**.

### 5. ✅ Verificar Código

- [x] Todas as referências ao schema corrigidas
- [x] `PublicCandidateForm.jsx` migrado
- [x] Autenticação migrada
- [x] Componente de alteração de senha criado
- [x] Sem erros de lint

### 6. ⚠️ Testes Locais (Recomendado)

Antes do deploy, teste localmente:

1. **Formulário público**: `http://localhost:5173/apply`
   - Preencher e enviar formulário
   - Verificar se salva no Supabase

2. **Login**: 
   - Testar login com conta staff do **seu** ambiente (sem credenciais no repositório)
   - Verificar se role é carregada

3. **Alteração de senha**:
   - Login com usuário de senha provisória
   - Verificar se modal aparece

### 7. 📝 Arquivos para Commit

**Novos arquivos:**
- `src/supabase.js`
- `src/components/ChangePasswordModal.jsx`
- `supabase/migrations/*.sql` (4 arquivos)
- `scripts/setup-supabase-users.js`
- `scripts/add-roles-to-existing-users.js`
- `GUIA_SETUP_SUPABASE.md`
- `CHECKLIST_PRE_DEPLOY.md`
- `REVISAO_SQL.md`

**Arquivos modificados:**
- `package.json` (adicionado @supabase/supabase-js)
- `src/components/PublicCandidateForm.jsx`
- `src/App.jsx`
- `README.md`

### 8. 🚀 Comandos para Deploy

```bash
# 1. Instalar dependências
npm install

# 2. Testar build local (opcional)
npm run build

# 3. Commit e push
git add .
git commit -m "feat: Migração Firebase para Supabase - Young Talents"
git push

# 4. O Vercel fará deploy automaticamente
# Certifique-se de ter configurado as variáveis de ambiente antes!
```

## ⚠️ Problemas Conhecidos e Soluções

### Problema: "Invalid schema: young_talents"

**Causa**: Schema não está exposto no PostgREST.

**Solução**: Execute o SQL acima (item 1) ou configure no dashboard.

### Problema: Formulário não salva

**Verificar**:
1. Schema está exposto?
2. Política RLS para `anon` está ativa?
3. Variáveis de ambiente configuradas?

### Problema: Login não funciona

**Verificar**:
1. Usuários criados no Supabase Auth?
2. Roles criadas na tabela `user_roles`?
3. Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas?

## ✅ Ordem de Execução

1. **No Supabase**:
   - ✅ Executar migrations 001, 002, 003 (já feito)
   - ⚠️ **EXECUTAR**: SQL para expor schema (item 1)
   - ⚠️ **EXECUTAR**: Migration 004 para criar roles

2. **Localmente**:
   - ⚠️ **EXECUTAR**: `npm install`
   - ⚠️ **TESTAR**: Formulário e login localmente

3. **No Vercel**:
   - ⚠️ **CONFIGURAR**: Variáveis de ambiente
   - ⚠️ **DEPLOY**: Push para trigger deploy

## 📋 Resumo Rápido

**Antes do commit:**
1. `npm install` ✅
2. Expor schema no Supabase ⚠️
3. Criar roles (SQL 004) ⚠️

**Antes do deploy:**
1. Configurar variáveis no Vercel ⚠️
2. Fazer push ⚠️

**Após deploy:**
1. Testar formulário público
2. Testar login
3. Verificar roles
