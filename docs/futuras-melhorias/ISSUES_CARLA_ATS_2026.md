# Issues e subissues – Young Talents ATS (feedback usuária Carla)

**Fonte:** Carla (usuária do app)  
**Repositório:** young-talents (ATS)  
**Data do registro:** Março 2026  
**Objetivo:** Backlog priorizável de correções e melhorias reportadas pela usuária.

**GitHub:** Issues criadas em [adventurelabsbrasil/young-talents/issues](https://github.com/adventurelabsbrasil/young-talents/issues) — #1 (YT-01) a #12 (YT-12).

---

## Índice

1. [YT-01 – Filtros: mais opções (idade e dados do formulário)](#yt-01--filtros-mais-opções-idade-e-dados-do-formulário)
2. [YT-02 – Sincronizar status entre Pipeline e Candidatura](#yt-02--sincronizar-status-entre-pipeline-e-candidatura)
3. [YT-03 – Manter filtro ao voltar do perfil do candidato](#yt-03--manter-filtro-ao-voltar-do-perfil-do-candidato)
4. [YT-04 – Foto e currículo sem depender de autorização do candidato](#yt-04--foto-e-curtículo-sem-dependente-de-autorização-do-candidato)
5. [YT-05 – Acesso específico por usuário (quem solicitou abertura da vaga)](#yt-05--acesso-específico-por-usuário-quem-solicitou-abertura-da-vaga)
6. [YT-06 – Migrar inscritos do banco de talentos antigo para o novo](#yt-06--migrar-inscritos-do-banco-de-talentos-antigo-para-o-novo)
7. [YT-07 – CNH e todos os dados do formulário no cadastro do candidato](#yt-07--cnh-e-todos-os-dados-do-formulário-no-cadastro-do-candidato)
8. [YT-08 – Permissão para cadastrar novos empreendimentos](#yt-08--permissão-para-cadastrar-novos-empreendimentos)
9. [YT-09 – Etapa "Vaga pausada" no funil](#yt-09--etapa-vaga-pausada-no-funil)
10. [YT-10 – Permissão para vincular candidato à vaga](#yt-10--permissão-para-vincular-candidato-à-vaga)
11. [YT-11 – Fluxo de desistência: apenas motivo, sem retorno obrigatório](#yt-11--fluxo-de-desistência-apenas-motivo-sem-retorno-obrigatório)
12. [YT-12 – Atualizar status da vaga (aberta → fechada / preenchida)](#yt-12--atualizar-status-da-vaga-aberta--fechada--preenchida)

---

## YT-01 – Filtros: mais opções (idade e dados do formulário)

**Prioridade:** Alta  
**Área:** Banco de Talentos / Pipeline / Filtros

### Descrição

Ter mais opções no filtro, incluindo **idade** e **todas as informações que o candidato preencheu no formulário** (para que seja possível filtrar por qualquer campo da inscrição).

### Subissues / critérios de aceite

- [x] Incluir filtro por **idade** (e/ou faixa etária).
- [ ] Disponibilizar nos filtros os demais campos preenchidos no formulário de inscrição (ex.: área de interesse, CNH, cidade, experiência, etc.), de forma consistente com o que existe no cadastro do candidato.
- [ ] Garantir que filtros aplicados sejam claros na UI (rótulos e valores possíveis).

---

## YT-02 – Sincronizar status entre Pipeline e Candidatura

**Prioridade:** Alta  
**Área:** Pipeline / Candidaturas

### Descrição

No **pipeline** o candidato muda de status (etapa do funil), mas na **candidatura** o status não é atualizado. O status deve refletir a mesma informação nos dois contextos.

### Subissues / critérios de aceite

- [ ] Ao mover o candidato de etapa no pipeline (Kanban), atualizar também o status da **candidatura** associada àquela vaga.
- [ ] Garantir que a tela/aba de candidatura exiba sempre o status atual alinhado ao pipeline.
- [ ] Definir regras de consistência (uma fonte de verdade para status por vaga/candidato).

---

## YT-03 – Manter filtro ao voltar do perfil do candidato

**Prioridade:** Alta  
**Área:** UX / Navegação / Banco de Talentos / Pipeline

### Descrição

Quando o usuário aplica um filtro, abre um candidato para ver mais informações e depois volta, a tela **não mantém o filtro** — volta ao início (lista sem filtro). Deve preservar filtros e posição ao retornar.

### Subissues / critérios de aceite

- [x] Ao navegar do listagem (com filtros aplicados) para o perfil do candidato e voltar, **manter filtros aplicados** e, se possível, posição de scroll/página.
- [ ] Aplicar o mesmo comportamento na Pipeline e no Banco de Talentos.
- [ ] Considerar uso de state na URL (query params) ou estado global para persistir filtros na sessão da página.

---

## YT-04 – Foto e currículo sem depender de autorização do candidato

**Plano técnico/jurídico:** [YT-04_PLANO_FOTO_CV_RECRUTADOR.md](./YT-04_PLANO_FOTO_CV_RECRUTADOR.md) · **GitHub:** [#4](https://github.com/adventurelabsbrasil/young-talents/issues/4) (aberta)

**Prioridade:** Alta  
**Área:** Perfil do candidato / Armazenamento / LGPD

### Descrição

Hoje não dá para ver foto ou currículo do candidato sem solicitar autorização ao próprio candidato; muitos não respondem. É necessário um fluxo em que a **visualização por recrutadores não dependa de autorização prévia do candidato** (respeitando política de privacidade e termos de uso).

### Subissues / critérios de aceite

- [ ] Definir modelo de consentimento/dados: se foto e currículo são enviados no ato da inscrição, considerar que o envio já constitui consentimento para uso no processo seletivo (documentar em termos/aviso).
- [ ] Permitir que usuários com permissão (recrutadores/admin) **vejam foto e currículo** no perfil do candidato sem passo extra de “solicitar autorização”.
- [ ] Remover ou ajustar o fluxo que exige autorização explícita do candidato para visualização interna.
- [ ] Revisar textos de aviso/termos na inscrição para deixar claro o uso dos dados no ATS.

---

## YT-05 – Acesso específico por usuário (quem solicitou abertura da vaga)

**Prioridade:** Média  
**Área:** Vagas / Permissões / Auditoria

### Descrição

Criar **acesso específico por usuário** para especificar **quem está solicitando a abertura de determinada vaga**. Permite rastreabilidade e controle por solicitante.

### Subissues / critérios de aceite

- [x] Campo ou vínculo “Quem solicitou a abertura” (ou similar) associado à vaga, identificando o **usuário** que solicitou (`requested_by_user_id` + trigger no INSERT).
- [x] Se já existir campo “Quem autorizou a abertura”, diferenciar claramente de “Quem solicitou” e preencher conforme regra de negócio (autorizou = `approved_by`; solicitou = preenchido automaticamente).
- [x] Garantir que apenas usuários autorizados possam abrir/criar vagas e que o solicitante fique registrado (RLS existente; trigger grava `auth.uid()`).
- [x] Exibir essa informação na tela da vaga e, se aplicável, em relatórios (exibição no modal da vaga implementada).

---

## YT-06 – Migrar inscritos do banco de talentos antigo para o novo

**Prioridade:** Média  
**Área:** Dados / Migração / Banco de Talentos

### Descrição

**Inserir no sistema novo as pessoas que se inscreveram no banco de talentos antigo**, para não perder histórico e permitir reutilização no ATS atual.

### Subissues / critérios de aceite

- [ ] Obter/exportar dados do banco de talentos antigo (formato e campos disponíveis).
- [ ] Mapear campos antigos → campos do Young Talents (candidatos, vagas, candidaturas, se houver).
- [x] Criar script ou fluxo de importação (CSV/API) com validação e tratamento de duplicados (fluxo existente: ver `docs/MIGRACAO_BANCO_TALENTOS_ANTIGO.md` e importação CSV na UI).
- [ ] Executar migração em ambiente controlado e validar com a usuária antes de produção.
- [x] Documentar processo e data da migração (guia em `docs/MIGRACAO_BANCO_TALENTOS_ANTIGO.md`).

**Guia:** [MIGRACAO_BANCO_TALENTOS_ANTIGO.md](../../MIGRACAO_BANCO_TALENTOS_ANTIGO.md)

---

## YT-07 – CNH e todos os dados do formulário no cadastro do candidato

**Prioridade:** Alta  
**Área:** Cadastro do candidato / Formulário de inscrição

### Descrição

No cadastro do candidato **não é possível identificar se tem CNH ou não**; esse requisito precisa ser **obrigatório** e visível. Hoje está apenas na “aba inicial”; no cadastro do candidato devem constar **todas as informações da inscrição**: CNH, área de interesse, etc. — todos os dados que ele preencheu no formulário inicial.

### Subissues / critérios de aceite

- [x] Incluir **CNH** (tem/não tem ou equivalente) como campo no cadastro do candidato, obrigatório quando aplicável, e visível na tela de perfil/cadastro.
- [ ] Garantir que **todos os dados do formulário de inscrição** estejam disponíveis e editáveis no cadastro do candidato (área de interesse, cidade, experiência, telefone, etc.).
- [ ] Revisar abas/seções do perfil para que nenhum dado da inscrição fique só na “aba inicial” sem equivalente no cadastro completo.
- [ ] Alinhar obrigatoriedade de CNH nas configurações de campos (se o app tiver gestão de obrigatoriedade por campo).

---

## YT-08 – Permissão para cadastrar novos empreendimentos

**Prioridade:** Alta  
**Área:** Permissões / Master data / Empresas–Unidades

### Descrição

A usuária **não está com acesso para cadastrar novos empreendimentos**; ao tentar, recebe erro informando que não tem permissão. Ajustar permissões (RLS e/ou roles) para que o perfil adequado possa cadastrar empreendimentos.

### Subissues / critérios de aceite

- [x] Identificar qual role/perfil deve poder criar/editar empreendimentos (admin e editor; gestores Young promovidos a editor em 032 e 034).
- [x] Revisar políticas RLS (e permissões de API, se houver) nas tabelas de empresas/empreendimentos/unidades (RLS já permite admin e editor; migration 034 garante que e-mails Young tenham editor).
- [x] Garantir que a usuária Carla (e demais usuários com o mesmo perfil) tenham permissão para cadastrar novos empreendimentos após o ajuste (executar migration 034 no Supabase).
- [x] Mensagem de erro em português e, se possível, orientando a quem não tem permissão (“Entre em contato com o administrador para solicitar acesso” em `errorMessages.js`).

**Onde cadastrar:** Vagas → aba **Empresas** (dados reais no Supabase). Configurações → Empresas ainda usa tela mock; usar Vagas → Empresas.

---

## YT-09 – Etapa "Vaga pausada" no funil

**Prioridade:** Alta  
**Área:** Pipeline / Etapas / Processo seletivo

### Descrição

Na parte de mudar o candidato de posição no funil (Inscrito, Considerado, Entrevista I, etc.) é necessário **inserir uma etapa “Vaga pausada”**, para poder retomar depois quando a vaga for reaberta. Hoje, ao pausar, só restam opções como reprovado ou desistência, o que não é adequado quando a vaga está apenas pausada e o histórico deve ser preservado.

### Subissues / critérios de aceite

- [ ] Adicionar **etapa (ou status) “Vaga pausada”** no fluxo do pipeline, distinta de reprovado e desistência.
- [ ] Permitir mover candidatos para “Vaga pausada” e, quando a vaga for retomada, permitir movê-los de volta para etapas ativas (ex.: Considerado, Entrevista I).
- [ ] Manter histórico de que o candidato esteve em “Vaga pausada” (datas e, se aplicável, motivo).
- [ ] Configuração de etapas (se existir tela de configuração do pipeline) deve incluir “Vaga pausada” e sua ordem no funil.
- [ ] Relatórios e KPIs: definir como tratar “Vaga pausada” (ex.: não contar como reprovado nem como desistência).

---

## YT-10 – Permissão para vincular candidato à vaga

**Prioridade:** Alta  
**Área:** Permissões / Vagas / Candidaturas

### Descrição

A usuária **não consegue vincular um candidato a uma vaga**; o sistema informa que não tem permissão. Ajustar permissões para que o perfil correto possa realizar o vínculo candidato–vaga.

### Subissues / critérios de aceite

- [x] Identificar tabela(s) e operação (INSERT/UPDATE) usadas ao vincular candidato à vaga (candidaturas/applications).
- [x] Revisar RLS e roles para permitir que o perfil da usuária (e equivalentes) possam criar/atualizar vínculos candidato–vaga.
- [ ] Testar fluxo completo: selecionar candidato, selecionar vaga, salvar vínculo, e verificar na pipeline/candidaturas.
- [x] Mensagem de erro em português quando permissão for negada.

### Implementado (mar/2026)

- **Migration 035:** (1) Sincronização one-off de `user_id` em `user_roles` onde estava NULL e o e-mail existe em `auth.users`; (2) função `is_editor_or_admin()` que considera role admin/editor por `user_id` ou por e-mail no JWT (quem tem `user_id` NULL); (3) políticas de INSERT/UPDATE em `applications` passaram a usar `is_editor_or_admin()`, permitindo vincular mesmo quando o usuário foi pré-cadastrado só por e-mail.
- **Front:** mensagem específica em PT para permissão negada ao vincular (`errorMessages.js` + `entity: 'applications'` em `createApplication` em `App.jsx`).

---

## YT-11 – Fluxo de desistência: apenas motivo, sem retorno obrigatório

**Prioridade:** Média  
**Área:** Pipeline / Transições / Motivos de perda

### Descrição

Quando se seleciona que o **candidato desistiu**, não faz sentido exigir **“retorno obrigatório”** (provavelmente “data de retorno” ou campo similar), pois o retorno é a própria desistência. O fluxo deve conter **apenas o motivo da desistência**, sem campos obrigatórios de retorno.

### Subissues / critérios de aceite

- [ ] No fluxo de marcar candidato como **desistência**, remover obrigatoriedade de campo “retorno” ou “data de retorno”.
- [ ] Manter **motivo da desistência** como informação principal (obrigatório ou opcional conforme regra de negócio).
- [ ] Revisar outros status “finais” (reprovado, etc.) para não exigir retorno quando não fizer sentido.
- [ ] Ajustar validações e mensagens na UI para desistência.

---

## YT-12 – Atualizar status da vaga (aberta → fechada / preenchida)

**Prioridade:** Alta  
**Área:** Vagas / Permissões ou fluxo de status

### Descrição

A usuária **não consegue atualizar o status da vaga** de “aberta” para “fechada” ou “preenchida”. Pode ser restrição de permissão ou ausência de opção na interface; é necessário permitir essa transição de status.

### Subissues / critérios de aceite

- [ ] Verificar se o problema é **permissão** (RLS/role): usuária sem permissão para UPDATE no status da vaga. Se for, ajustar políticas.
- [ ] Verificar se na **interface** existem opções (dropdown/botão) para marcar vaga como “fechada” e “preenchida”; se não existirem, incluir.
- [ ] Garantir que as transições (aberta → fechada, aberta → preenchida) estejam salvas corretamente no banco e reflitam em listagens e relatórios.
- [ ] Documentar no guia de uso como alterar o status da vaga.

---

## Resumo para priorização

| ID     | Título resumido                                      | Prioridade |
|--------|------------------------------------------------------|------------|
| YT-01  | Filtros: idade e dados do formulário                 | Alta       |
| YT-02  | Sincronizar status Pipeline ↔ Candidatura            | Alta       |
| YT-03  | Manter filtro ao voltar do perfil                    | Alta       |
| YT-04  | Foto/currículo sem autorização do candidato          | Alta       |
| YT-05  | Acesso por usuário (quem solicitou a vaga)           | Média      |
| YT-06  | Migrar banco de talentos antigo → novo               | Média      |
| YT-07  | CNH e todos os dados do formulário no cadastro       | Alta       |
| YT-08  | Permissão: cadastrar empreendimentos                 | Alta       |
| YT-09  | Etapa "Vaga pausada" no funil                        | Alta       |
| YT-10  | Permissão: vincular candidato à vaga                 | Alta       |
| YT-11  | Desistência: só motivo, sem retorno obrigatório      | Média      |
| YT-12  | Atualizar status da vaga (fechada/preenchida)        | Alta       |

---

*Documento gerado a partir do feedback da usuária Carla. Para dúvidas ou refinamento, consultar registro em `knowledge/` ou backlog do cliente Young.*
