# Guia de Troubleshooting - Login (Supabase Auth)

O Young Talents usa **Supabase Auth** com suporte a **email/senha** e **Google OAuth**. Use este guia para problemas de login.

## Problemas Comuns e Soluções

### 1. **Erro: "popup blocked" ou popup não abre (Google)**

- **Causa:** Navegador bloqueando popups.
- **Solução:**
  - Permita popups para o site (localhost ou domínio Vercel).
  - Ou use o fluxo "Entrar com Google" em nova aba se disponível.

### 2. **Erro: "invalid_client" ou "redirect_uri_mismatch" (Google OAuth)**

- **Causa:** URI de redirecionamento não configurada no Google Cloud Console.
- **Solução:**
  1. Acesse [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
  2. Edite a credencial OAuth 2.0 usada pelo Supabase.
  3. Em "Authorized redirect URIs" adicione:
     - `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`
     - Para testes: `http://localhost:5173`
  4. No Supabase: Authentication → Providers → Google → confira Client ID e Client Secret.

### 3. **Erro: variáveis de ambiente não configuradas**

- **Causa:** `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` ausentes no ambiente onde o app roda.
- **Solução:**
  - **Local:** crie `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
  - **Vercel:** Settings → Environment Variables → adicione as duas variáveis para Production/Preview/Development.
  - Reinicie o servidor (`npm run dev`) ou faça redeploy no Vercel.

### 4. **Erro: "Cannot read properties of undefined (reading 'auth')"**

- **Causa:** Cliente Supabase não inicializado (variáveis de ambiente faltando ou inválidas).
- **Solução:** Verifique item 3 e confira no console do navegador se não há `[Supabase] Erro: Variáveis de ambiente não configuradas`.

### 5. **Login aceito mas usuário sem permissões / tela em branco**

- **Causa:** Usuário existe no Supabase Auth mas **não** tem linha em `young_talents.user_roles` com `admin`, `editor` ou `viewer` (cadastro explícito).
- **Solução:**
  - Um **admin** deve cadastrar o e-mail em **Configurações → Usuários** ou via SQL/Edge Function. Ver [GUIA_CRIAR_USUARIO_ADMIN.md](./GUIA_CRIAR_USUARIO_ADMIN.md) e [SECURITY_MODEL.md](./SECURITY_MODEL.md).
  - Com a migration **028**, o trigger **`sync_user_role_on_login`** **não cria** mais linha automática: só **atualiza** `user_id` se a linha já existir.

### 5c. **Papéis `admin`, `editor` e `viewer`**

- **`admin` / `editor`:** acesso ao ATS; editor não gerencia usuários (Configurações restrita a admin onde aplicável).
- **`viewer`:** acesso ao ATS em **somente leitura** (RLS + `hasPermission`); menu **Configurações** oculto; rota `/settings` redireciona.
- **Sem linha em `user_roles`:** sessão pode existir, mas o app envia para **`/apply`**; a API **não** retorna dados do CRM (RLS migration **028**).

### 5b. **Google OAuth volta para a tela de login, mas email/senha funciona**

- **Causa comum 1:** O Google devolve o e-mail com **capitalização diferente** da coluna `email` em `user_roles` (ex.: `Contato@…` vs `contato@…`). O app comparava com `===` e tratava como “sem staff”.
- **Causa comum 2:** Após o redirect do OAuth, a rota interna era avaliada **antes** do fetch de `user_roles` terminar → `hasStaffRole` ficava falso por um frame e redirecionava para `/login`.
- **Solução no código:** comparação de e-mail **case-insensitive** + estado **authStaffReady** (loader “Verificando permissões…” até carregar `user_roles`). Contas listadas em `isDeveloper` (ex.: `dev@adventurelabs.com.br`) não sofrem o mesmo sintoma porque já entram como staff sem esperar a tabela.

### 6. **Erro ao criar usuário via Configurações (email e senha)**

- **Causa:** Edge Function `create-user` não deployada ou secrets não configurados.
- **Solução:** Siga [GUIA_CRIAR_USUARIO_ADMIN.md](./GUIA_CRIAR_USUARIO_ADMIN.md) seção "Opção 3: Com Email e Senha". Deploy: `supabase functions deploy create-user` e configure `SUPABASE_SERVICE_ROLE_KEY` nos secrets.

### 7. **Dependências / "Cannot find module"**

- **Solução:**
  ```bash
  npm install
  npm run dev
  ```

## Configuração Local

1. Copie `.env.example` para `.env.local` (se existir).
2. Preencha:
   - `VITE_SUPABASE_URL` = URL do projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = Chave anon (public)
   - (Opcional) `SUPABASE_SERVICE_ROLE_KEY` para scripts como `setup-supabase-users.js`
3. Reinicie o servidor.

## Configuração Vercel

1. Vercel Dashboard → projeto → Settings → Environment Variables.
2. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Marque Production (e Preview/Development se quiser).
4. Salve e faça **Redeploy** para aplicar.

## Domínios autorizados (Supabase)

No Supabase: Authentication → URL Configuration:

- **Site URL:** sua URL de produção (ex.: `https://seu-app.vercel.app`)
- **Redirect URLs:** inclua `https://seu-app.vercel.app/**` e `http://localhost:5173/**` para desenvolvimento

## Verificação rápida

- Console do navegador (F12): não deve aparecer `[Supabase] Erro`.
- Após login, a aplicação deve carregar o dashboard ou a área autenticada; se redirecionar de volta para login, confira `user_roles` e RLS.
