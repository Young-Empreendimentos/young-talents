# Como enviar o email em HTML pelo Gmail

O Gmail não permite colar HTML no corpo da mensagem. Use uma destas opções.

> **Processo da empresa:** O padrão Adventure Labs para emails em HTML para clientes está documentado na base de conhecimento: **`knowledge/00_GESTAO_CORPORATIVA/processos/email-html-cliente-adventure-labs.md`** (no monorepo). Esse processo inclui o link do projeto Google Apps Script compartilhado e o padrão visual. Este doc é o exemplo específico (Young Talents — exportação); para outro cliente ou feature, siga o processo e edite o HTML no script.

---

## Opção 1: Google Apps Script (recomendado)

O script **envia o email em HTML para você mesmo**. Você abre o email na caixa de entrada e **encaminha** para o cliente — o HTML é preservado.

1. Abra **[script.google.com](https://script.google.com)** e crie um novo projeto (ou use um existente).
2. Apague o conteúdo do arquivo `Code.gs` e **cole todo o conteúdo** do arquivo **`gmail-draft-html.js`** (nesta pasta).
3. No menu, escolha **Executar** → **Executar função** → **`enviarParaMim`**.
4. Na primeira vez, o Google pede **autorização**: clique em “Revisar permissões”, escolha sua conta e permita o acesso ao Gmail.
5. Abra o **Gmail** → caixa de **Entrada**. O email em HTML estará lá.
6. Abra o email, clique em **Encaminhar**, coloque o email do cliente (e ajuste o texto se quiser) e envie.

**Alternativa:** se quiser enviar direto para o cliente, altere a constante `DESTINATARIO` no topo do `gmail-draft-html.js` e execute a função **`enviarParaCliente`** em vez de `enviarParaMim`.

---

## Opção 2: Extensão no Chrome

Instale uma extensão que permita enviar HTML no Gmail, por exemplo:

- **“HTML Editor for Gmail”** ou **“Send as HTML”** (pesquise na Chrome Web Store).

Geralmente o fluxo é: escrever/colar o HTML na extensão → ela injeta o resultado no corpo do rascunho do Gmail. Verifique as instruções de cada extensão.

---

## Opção 3: Abrir o HTML e copiar “como está” (limitado)

1. Abra o arquivo `email-cliente-export-candidatos.html` no **Chrome** (duplo clique ou Arrastar para o navegador).
2. Selecione **todo o texto visível** na página (Ctrl+A ou Cmd+A).
3. Copie (Ctrl+C ou Cmd+C).
4. No Gmail, crie um novo email e **cole** (Ctrl+V ou Cmd+V).

O Gmail pode preservar parte da formatação (negrito, listas, parágrafos), mas costuma remover cores, bordas e layout de tabela. Use só se quiser algo rápido e não se importar de perder parte do visual.

---

## Resumo

| Opção              | Esforço | Resultado do HTML      |
|--------------------|--------|-------------------------|
| Apps Script        | Médio  | Completo (recomendado)  |
| Extensão Chrome    | Baixo  | Depende da extensão    |
| Copiar do navegador| Baixo  | Parcial (só texto/estilo básico) |

Para o email da nova feature (exportação) ficar igual ao arquivo HTML, use a **Opção 1** (Google Apps Script).
