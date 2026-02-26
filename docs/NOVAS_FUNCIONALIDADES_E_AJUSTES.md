# Novas funcionalidades e ajustes – Young Talents ATS

**Data:** Fevereiro 2026  
**Para:** Usuário final do aplicativo

Este documento resume as novidades e correções recentes para que você aproveite melhor o sistema no dia a dia.

---

## 1. Filtro “Em consideração” (estrela) com 3 opções

- Na **Pipeline** e no **Banco de Talentos** há três ícones de estrela no topo (ao lado da busca):
  - **Estrela cinza:** mostra só candidatos **não** marcados como “em consideração”.
  - **Estrela amarela (contorno):** mostra **todos** os candidatos (padrão).
  - **Estrela amarela (preenchida):** mostra só os que estão **em consideração**.
- Ao passar o mouse sobre cada ícone, aparece um texto explicando o que ele faz.
- Você pode marcar ou desmarcar a estrela “em consideração” em **qualquer etapa** do funil (não só em “Inscrito”). Assim, ao filtrar por “em consideração”, continuam aparecendo também quem já avançou (Considerado, Entrevista, Testes etc.), desde que esteja marcado.

**Onde fica:** Barra superior da Pipeline e do Banco de Talentos (grupo de três estrelas).

---

## 2. Onde preencher “Quem autorizou a abertura” na vaga

- Se ao **criar ou editar uma vaga** aparecer aviso sobre “Quem autorizou a abertura”:
  - Esse campo fica na **tela de edição da vaga**, na **seção de gestão**, **abaixo de “Recrutador Responsável”**.
  - Role a página da vaga até a parte de gestão e preencha o campo “Quem autorizou a abertura”.
- Se o seu banco ainda não tiver esse campo, o sistema pode perguntar se deseja **salvar mesmo assim sem essa informação**. Se aceitar, a vaga é salva normalmente; você pode preencher o campo depois, quando o suporte técnico tiver atualizado o banco.

---

## 3. Mensagens de erro em português

- Erros que antes apareciam em inglês (por exemplo sobre colunas do banco) agora são exibidos em **português**, com explicação do que aconteceu e, quando fizer sentido, o que fazer (por exemplo: “Execute o SQL de atualização no Supabase” ou “O campo fica na seção de gestão da vaga”).

---

## 4. Não recarregar tudo ao trocar de tela

- Ao sair de uma tela (por exemplo Pipeline) e voltar para a mesma tela, o sistema **não recarrega mais todos os dados** do zero.
- Os dados continuam como estavam, a não ser que você faça um refresh manual (veja abaixo).

---

## 5. Botão “Atualizar” no topo

- No **cabeçalho** da área principal (ao lado de “Filtros” e do ícone de tema claro/escuro) há um botão **“Atualizar”**.
- Ao clicar, o sistema **recarrega** candidatos, vagas e demais dados do servidor. Use quando quiser garantir que está vendo as informações mais recentes.

---

## 6. Histórico de movimentações do candidato (aba Administrativo)

- **Cada ação** feita em um candidato (mudança de etapa, marcação “em consideração”, alteração de dados, nova candidatura, nota na candidatura, entrevista agendada etc.) passa a ser **registrada** no sistema.
- Esse histórico pode ser visto no **perfil do candidato**, na aba **“Administrativo”** (URL: `.../candidate/[id]/admin`).
- Na seção **“Log de movimentações”** aparecem data/hora, quem fez a ação e a descrição (por exemplo: “Status alterado para Entrevista I”, “Marcado em consideração”).
- **Quem vê:** apenas usuários com perfil de **administrador**. Para os demais, essa seção não exibe o log.

---

## 7. Arquivos SQL para atualizar o banco (para o administrador)

- Se aparecerem erros como “coluna não existe” (por exemplo “approved_by” em vagas ou “starred”/“closed_at” em candidatos), o **administrador** pode corrigir rodando scripts SQL no Supabase.
- Na pasta **`docs/sql/`** do projeto existem arquivos prontos para executar no Supabase (SQL Editor), na ordem:
  - **01** – coluna “Quem autorizou” em vagas  
  - **02** – coluna “Em consideração” (estrela) em candidatos  
  - **03** – colunas de processo (entrevistas, data de fechamento etc.) em candidatos  
  - **04** – atualização da view de candidatos para o app “enxergar” essas colunas  
- O arquivo **`docs/sql/README.md`** explica quando usar cada um e a ordem. Depois de rodar o **04**, o erro de “starred não existe” tende a sumir se ainda aparecer após 01, 02 e 03.

---

## Resumo rápido

| O que mudou | Onde usar |
|-------------|-----------|
| Três opções de filtro por estrela (todos / em consideração / não considerados) | Pipeline e Banco de Talentos – ícones no topo |
| Estrela “em consideração” em qualquer etapa | Cards e tabela – clique na estrela do candidato |
| Aviso em português e opção de salvar vaga sem “Quem autorizou” | Ao criar/editar vaga |
| Dados não recarregam ao só trocar de tela | Automático |
| Botão “Atualizar” | Cabeçalho (ao lado de Filtros e tema) |
| Log de movimentações do candidato | Perfil do candidato → aba Administrativo (só admin) |
| SQL para corrigir erros de coluna | `docs/sql/` – para o administrador rodar no Supabase |

Se tiver dúvidas sobre alguma dessas mudanças, consulte o manual completo ou fale com o administrador do sistema.
