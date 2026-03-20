# 📋 Resumo Final - O que falta para Deploy

## ✅ O que já está pronto:

1. ✅ Código migrado para Supabase
2. ✅ Schema e tabelas criadas no Supabase
3. ✅ Scripts SQL criados
4. ✅ Dependência `@supabase/supabase-js` adicionada
5. ✅ Documentação criada
6. ✅ Usuários criados no Supabase Auth

## ⚠️ O que falta fazer (3 passos críticos):

### 1. Expor Schema no Supabase (CRÍTICO)

**Execute no SQL Editor do Supabase:**

```sql
-- Expor schema young_talents no PostgREST
ALTER DATABASE postgres SET search_path TO public, young_talents;
```

**OU** configure manualmente:
- Dashboard → Settings → API → PostgREST
- Adicione `young_talents` no campo "Extra Search Path"

**Por quê?** Sem isso, as queries do frontend não encontrarão as tabelas.

### 2. Criar Roles dos Usuários

**Execute no SQL Editor do Supabase:**
- Copie e execute o conteúdo de `supabase/migrations/004_add_initial_user_roles.sql`

Isso criará as roles na tabela `young_talents.user_roles` para os 5 usuários.

### 3. Configurar Variáveis no Vercel

**No Vercel Dashboard:**
1. Vá em Settings → Environment Variables
2. Adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua anon key do Supabase
3. Configure para Production, Preview e Development

## 🚀 Comandos para Deploy:

```bash
# 1. Instalar dependências (se ainda não fez)
npm install

# 2. Testar build local (opcional, mas recomendado)
npm run build

# 3. Commit e push
git add .
git commit -m "feat: Migração Firebase para Supabase - Young Talents"
git push origin main
```

## 📝 Checklist Rápido:

- [ ] Expor schema `young_talents` no Supabase (SQL acima)
- [ ] Executar script SQL `004_add_initial_user_roles.sql`
- [ ] `npm install` (instalar @supabase/supabase-js)
- [ ] Configurar variáveis no Vercel
- [ ] Fazer commit e push
- [ ] Testar após deploy

## 🧪 Testes Após Deploy:

1. **Formulário público**: `/apply` - deve salvar no Supabase
2. **Login**: usar conta staff configurada localmente (não usar credenciais de exemplo em produção)
3. **Verificar roles**: Deve carregar permissões corretas

## ⚠️ Importante:

- O formulário público **pode funcionar** mesmo sem expor o schema (usa política anon)
- A autenticação **pode funcionar** normalmente
- Mas as **roles e queries autenticadas** precisam do schema exposto

**Recomendação**: Execute o passo 1 (expor schema) antes do deploy para evitar problemas.
