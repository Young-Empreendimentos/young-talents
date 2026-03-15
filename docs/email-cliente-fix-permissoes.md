# Email para cliente — Correção de permissões (FIX)

**Assunto sugerido:**  
**Young Talents — Correção aplicada: permissões e acesso ao sistema**

---

**Conteúdo:** Informa ao cliente que a correção de permissões (RLS no Supabase) foi aplicada; quem tem acesso total (dev@, contato@, eduardo@) e que não é necessário alterar nada — basta acessar normalmente.

---

## Como enviar (Google Apps Script)

1. Abra **[script.google.com](https://script.google.com)** e crie um novo projeto (ou use o existente de emails HTML).
2. Cole todo o conteúdo do arquivo **`gmail-appscript-email-fix-permissoes.js`** (nesta pasta) em `Code.gs`.
3. Menu: **Executar** → **Executar função** → **`enviarParaMim`**.
4. Na primeira vez, autorize o acesso ao Gmail.
5. Abra o **Gmail** → **Entrada**. O email em HTML estará lá. Abra o email, clique em **Encaminhar**, coloque o email do cliente e envie.

**Enviar direto ao cliente:** altere a constante `DESTINATARIO` no topo do script e execute a função **`enviarParaCliente`**.

---

Para o padrão geral de envio de HTML (processo Adventure Labs), ver [gmail-enviar-html-email.md](./gmail-enviar-html-email.md).
