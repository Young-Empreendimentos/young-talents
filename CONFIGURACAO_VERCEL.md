# 🔧 Configuração das Variáveis de Ambiente no Vercel

## ⚠️ IMPORTANTE: Migração para Supabase

A aplicação agora usa **Supabase** como banco de dados principal. As variáveis do Firebase são opcionais (apenas se ainda houver funcionalidades usando Firebase).

## 📋 Passo a Passo para Configurar

### 1. Acesse o Vercel Dashboard
- Vá em: https://vercel.com/dashboard
- Selecione o projeto `young-talents` (ou o nome do seu projeto)

### 2. Vá em Settings → Environment Variables

### 3. Configure as variáveis do Supabase (OBRIGATÓRIAS):

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anônima do Supabase | Supabase Dashboard → Settings → API → anon public key |

#### Como obter os valores do Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → valor para `VITE_SUPABASE_URL`
   - **anon public** (chave pública) → valor para `VITE_SUPABASE_ANON_KEY`

**Exemplo:**
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTg3NjgwMCwiZXhwIjoxOTYxNDUyODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. ⚠️ ATENÇÃO:
- **NÃO** coloque aspas nos valores
- **NÃO** coloque espaços extras antes ou depois
- Configure para **Production**, **Preview** e **Development** (ou pelo menos Production)
- Os valores são sensíveis - mantenha-os seguros

### 5. Variáveis do Firebase (OPCIONAIS - apenas se ainda usar Firebase):

Se ainda houver funcionalidades usando Firebase, configure também:

| Variável | Valor |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | Sua chave API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Seu domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | ID do seu projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

### 6. Após salvar, faça um novo deploy:
- Vá em **Deployments**
- Clique nos **3 pontos** do último deployment
- Selecione **Redeploy**

### 7. Verifique se funcionou:
- Após o deploy, abra a aplicação no host
- Abra o Console do navegador (F12)
- Não deve haver erros de `[Supabase] Erro: Variáveis de ambiente não configuradas`
- Você deve conseguir fazer login normalmente

## 🔍 Como Verificar se Está Funcionando

1. Abra o Console do navegador (F12)
2. Procure por logs que começam com `[Supabase]`
3. **NÃO** deve aparecer erros de configuração
4. Se aparecer erro, verifique se as variáveis estão configuradas corretamente

### Verificação no Console:
- ✅ **Sucesso**: Não há erros de `[Supabase] Erro`
- ❌ **Erro**: Aparece `[Supabase] Erro: Variáveis de ambiente não configuradas`

## 🐛 Troubleshooting

### Erro persiste após configurar?
1. Verifique se salvou as variáveis (não apenas digitou)
2. Verifique se fez um **novo deploy** (Redeploy)
3. Limpe o cache do navegador (Ctrl+F5)
4. Verifique se não há espaços ou caracteres invisíveis nos valores
5. Verifique se copiou os valores completos (especialmente a chave anon que é longa)

### Como copiar os valores corretamente do Supabase?
1. No Supabase Dashboard → Settings → API
2. Clique no ícone de **copiar** ao lado do valor
3. Cole diretamente no Vercel **sem aspas** e **sem espaços extras**
4. Para a chave anon, certifique-se de copiar a chave completa (é muito longa)

### Erro: "Cannot read properties of undefined (reading 'auth')"
- Isso significa que o Supabase não foi inicializado
- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
- Faça um novo deploy após configurar

## 📝 Checklist de Configuração

- [ ] `VITE_SUPABASE_URL` configurada no Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` configurada no Vercel
- [ ] Variáveis configuradas para Production (e Preview/Development se necessário)
- [ ] Novo deploy realizado após configurar
- [ ] Console do navegador não mostra erros de Supabase
- [ ] Login funciona corretamente
