# Diagnóstico Supabase – Young Talents

Este diagnóstico é executado **no seu ambiente**: você roda o SQL no projeto correto e, se quiser, o script Node com o `.env` apontando para esse projeto. A organização onde estão os projetos é `xmijkpuquwzgtrhznabs`; o projeto do app Young Talents tem ref **ttvwfocuftsvyziecjeu** (a URL será `https://ttvwfocuftsvyziecjeu.supabase.co`).

## 1. Script SQL (recomendado)

Lista tabelas, políticas RLS, funções e grants sem alterar nada no banco.

### Passos

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) e selecione o projeto **Young Talents** (ref `ttvwfocuftsvyziecjeu`).
2. Vá em **SQL Editor**.
3. Abra o arquivo [DIAGNOSTICO_SUPABASE.sql](./DIAGNOSTICO_SUPABASE.sql) neste repositório, copie todo o conteúdo e cole no editor.
4. Execute (Run).
5. Copie o resultado das abas/resultados (tabelas, políticas, funções, contagens, user_roles) e guarde para análise ou para colar em um chat/ticket.

### O que o SQL retorna

- **1_TABELAS** – Tabelas no schema `young_talents` e se RLS está ativo.
- **2_POLITICAS** – Políticas RLS por tabela (nome, comando, USING, WITH CHECK).
- **3_FUNCOES** – Existência de `is_developer` e `is_admin` no schema `young_talents`.
- **4_GRANTS_FUNCOES** – Se `authenticated` (e outros) têm EXECUTE nessas funções.
- **5_GRANTS_SCHEMA** – Quais roles têm USAGE no schema `young_talents`.
- **6_USER_ROLES** – Contagem e lista (user_id, email, role) em `young_talents.user_roles`.

O script é somente leitura (apenas `SELECT` e consultas a catálogos).

## 2. Script Node (opcional)

Testa conectividade e acesso à API com as credenciais do `.env` (anon e, se existir, service_role).

### Passos

1. No projeto, configure o `.env` ou `.env.local` com:
   - `VITE_SUPABASE_URL` (ou `SUPABASE_URL`) = URL do projeto Young Talents
   - `VITE_SUPABASE_ANON_KEY` (ou `SUPABASE_ANON_KEY`) = chave anon
   - Opcional: `SUPABASE_SERVICE_ROLE_KEY` para testes com service role
2. Na raiz do projeto, execute:
   ```bash
   node scripts/diagnostico-supabase.js
   ```
3. O script imprime um resumo: URL (mascarada), se as leituras passaram e mensagens de erro exatas (ex.: `permission denied for table users`, `infinite recursion`). Copie essas mensagens se precisar de análise.

O script **não** faz INSERT/UPDATE/DELETE; apenas lê com anon (e com service_role se configurada). Testes de escrita (ex.: criar empresa) devem ser feitos manualmente no app com usuário logado.

## 3. O que conferir após rodar

- Todas as tabelas esperadas existem em `young_talents` (candidates, companies, cities, sectors, positions, jobs, job_levels, activity_areas, applications, user_roles, activity_log, etc.).
- RLS está ativo e o número de políticas por tabela está coerente (sem duplicatas ou políticas antigas que causem recursão em `user_roles`).
- As funções `is_developer()` e `is_admin()` existem em `young_talents` e têm EXECUTE para `authenticated`.
- Os usuários em `user_roles` batem com o esperado (incluindo o dev `6d3c9cde-fe5f-496a-a5ec-0fedb05d1df4` como admin).
- O schema `young_talents` está exposto na API: em **Dashboard → Settings → API → Exposed schemas** deve constar `young_talents` (além de `public`).

Com o resultado do SQL (e, se quiser, o output do script Node), você pode colar trechos ou erros aqui para interpretação e sugestão de correções (migrations ou RLS).
