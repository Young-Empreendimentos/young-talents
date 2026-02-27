# Como adicionar novos usuários no app

Novos usuários podem ser adicionados **pelo próprio aplicativo**, na tela de Configurações. Não é necessário o desenvolvedor fazer alterações no código ou direto no Supabase para cada novo usuário; a criação fica conectada ao Supabase (tabela `user_roles` e, no modo "email e senha", ao Supabase Auth).

## Onde fica

1. Acesse **Configurações** (ícone de engrenagem no menu).
2. Abra a aba **Usuários**.
3. O formulário **"Novo Usuário"** só aparece para quem está logado como **Administrador**. Outros perfis (Recrutador, Visualizador) não veem essa opção.

## Quem pode adicionar

Apenas usuários com perfil **Administrador** podem criar ou editar outros usuários e suas permissões.

## Dois modos de cadastro

### 1. Login com Google

- O administrador informa o **email** do novo usuário (e, opcionalmente, nome e perfil).
- É criado ou atualizado um registro na tabela `user_roles` do Supabase com esse email e a role escolhida (Administrador, Recrutador ou Visualizador).
- O novo usuário deve fazer **login com Google** usando exatamente esse email. No primeiro login, um trigger no Supabase sincroniza `user_id`, nome e foto em `user_roles`.
- **Nenhuma Edge Function é necessária** para este modo.

### 2. Email e senha

- O administrador informa **email**, **senha** (mínimo 6 caracteres), nome e perfil.
- O app chama a **Edge Function** `create-user` no Supabase, que cria o usuário no **Supabase Auth** e pode criar/atualizar o registro em `user_roles`.
- O novo usuário faz login em **/login** com esse email e senha.
- **Requisito:** a Edge Function `create-user` precisa estar publicada no projeto Supabase. Se não estiver, o app exibe uma mensagem orientando o deploy. O desenvolvedor deve executar uma vez:  
  `supabase functions deploy create-user`  
  Depois disso, qualquer administrador pode criar usuários por email e senha pelo app.

## Resumo

| Modo            | Onde o admin cadastra | O que o novo usuário faz      | Dependência extra      |
|-----------------|------------------------|-------------------------------|-------------------------|
| Login com Google | Configurações > Usuários | Entrar com Google (mesmo email) | Nenhuma                 |
| Email e senha   | Configurações > Usuários | Login em /login com email e senha | Edge Function `create-user` deployada |

Assim, a adição de usuários é feita **dentro do app**, conectada ao Supabase; só é necessário o deploy único da função `create-user` se for usar o modo "Email e senha".
