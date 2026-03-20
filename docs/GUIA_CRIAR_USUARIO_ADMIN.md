# Guia: Criar Usuário Admin no Supabase

Este guia explica como criar usuários administradores e desenvolvedores no Young Talents, que utiliza **Supabase** para autenticação.

## Opção 1: Script setup-supabase-users.js (Recomendado)

### Pré-requisitos

1. Configure as variáveis de ambiente no `.env.local`:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

2. Certifique-se de que as migrations foram executadas (schema `young_talents` e tabela `user_roles` existem).

### Configurar a lista de usuários

Os usuários **não** vêm mais no código (por segurança). Use um arquivo local que não é versionado:

1. Copie o exemplo:
   ```bash
   cp scripts/users-setup.example.json scripts/users-setup.local.json
   ```
2. Edite `scripts/users-setup.local.json` e preencha o array `users` com email, senha, role e name de cada usuário.
3. O arquivo `users-setup.local.json` está no `.gitignore` — nunca commite credenciais.

### Executar o script

```bash
node scripts/setup-supabase-users.js
```

O script cria ou atualiza os usuários definidos em `users-setup.local.json` e suas roles em `young_talents.user_roles`.

### Login

Após criar os usuários, acesse `/login` e use **Email e senha** ou **Entrar com Google** (se o usuário foi configurado com o mesmo email no Supabase/OAuth).

---

## Opção 2: Supabase Dashboard

### Criar usuário no Auth

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Clique em **Add user** > **Create new user**
5. Preencha:
   - **Email**: ex. `admin@adventurelabs.com.br`
   - **Password**: defina uma senha segura
   - Marque **Auto Confirm User**
6. Clique em **Create user**

### Configurar Role

Após criar o usuário, adicione a role na tabela `young_talents.user_roles`:

1. Vá em **SQL Editor**
2. Execute (substituindo email, name e role):

```sql
INSERT INTO young_talents.user_roles (user_id, email, name, role)
SELECT id, 'seu@email.com', 'Nome do Usuário', 'admin'
FROM auth.users
WHERE email = 'seu@email.com';
```

Ou, se o usuário ainda não fez login (user_id = null):

```sql
INSERT INTO young_talents.user_roles (user_id, email, name, role)
VALUES (NULL, 'seu@email.com', 'Nome do Usuário', 'admin');
```

Com a migration **028**, o trigger `sync_user_role_on_login` **só atualiza** `user_id` e metadados se **já existir** linha em `user_roles` para aquele e-mail. **Não** cria mais usuário `viewer` automático no primeiro login — o cadastro deve existir antes (admin ou Edge Function).

---

## Opção 3: Adicionar usuário pelo Frontend

### Com Google OAuth

Para usuários que farão login com **Google**:

1. Faça login como admin
2. Vá em **Configurações** > **Usuários do sistema**
3. Clique em **Adicionar Usuário**
4. Informe o email do Google, nome e role
5. O usuário deve ir em `/login` e clicar em **Entrar com Google** com o mesmo email

O sistema vincula automaticamente no primeiro login.

### Com Email e Senha

Para criar usuários com email e senha diretamente pelo frontend, é necessário fazer o deploy da Edge Function `create-user`:

1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli) e faça login:
   ```bash
   supabase login
   ```

2. Link o projeto (se ainda não estiver):
   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   ```

3. Faça o deploy da função:
   ```bash
   supabase functions deploy create-user
   ```

4. Configure o secret `SUPABASE_SERVICE_ROLE_KEY` no projeto (geralmente já existe):
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

Depois do deploy, em **Configurações > Usuários > Adicionar Usuário**, selecione **Email e senha**, preencha email, senha, nome e perfil, e clique em **Adicionar**.

---

## Roles disponíveis

| Role   | Descrição                                                    |
|--------|--------------------------------------------------------------|
| admin  | Acesso total, incluindo gestão de usuários                   |
| editor | Recrutador: editar candidatos, mover no funil, agendar       |
| viewer | Apenas visualização                                          |

---

## Segurança

- Modelo completo (RLS, público, papéis): [SECURITY_MODEL.md](./SECURITY_MODEL.md)
- **Após o primeiro login, altere a senha provisória** em Configurações > Alterar senha
- A `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta no frontend
- Use o script apenas em ambiente local ou em pipelines seguros

---

## Troubleshooting

### Erro: "Edge Function create-user não encontrada"
A função não foi deployada. Execute:
```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy create-user
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```
No Supabase Dashboard: Project Settings > Edge Functions > confira se `create-user` aparece e se as variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas.

### Erro: "Este email já está cadastrado"
O usuário já existe no Auth. Use o Supabase Dashboard (Authentication > Users) para resetar a senha ou adicione a role manualmente em `young_talents.user_roles`.

### Erro: "Sessão inválida. Faça login novamente."
O JWT expirou. Faça logout e login novamente antes de criar usuários.

### Erro: "Apenas administradores podem criar usuários"
O usuário logado não tem role `admin`. Verifique em `young_talents.user_roles` e crie o primeiro admin via script ou Dashboard.

### Erro: "User already registered"
O usuário já existe. Use o Supabase Dashboard para resetar a senha ou execute o script novamente (ele atualiza a role se o usuário existir).

### Erro: "relation young_talents.user_roles does not exist"
Execute as migrations do Supabase na ordem correta.

### Usuário criado mas sem permissões
Verifique se existe registro em `young_talents.user_roles` com o email correto e role adequada.

### Login de desenvolvedor não funciona
Confirme que o email é um dos reconhecidos: `dev@adventurelabs.com.br` ou `developer@adventurelabs.com.br`, e que o usuário existe no Supabase Auth.
