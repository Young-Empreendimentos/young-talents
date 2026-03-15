/**
 * Google Apps Script — Enviar email em HTML pelo Gmail
 *
 * COMO USAR:
 * 1. Abra https://script.google.com e crie um novo projeto.
 * 2. Cole TODO este arquivo em Code.gs (substitua o conteúdo).
 * 3. (Opcional) Altere ASSUNTO e DESTINATARIO abaixo.
 * 4. Menu: Executar → criarRascunho (ou enviarParaMim).
 * 5. Autorize o acesso ao Gmail quando o Google pedir.
 *
 * criarRascunho() = envia o email PARA VOCÊ MESMO. Você abre o email recebido,
 *   clica em "Encaminhar", coloca o email do cliente e envia. O HTML é preservado.
 *
 * enviarParaCliente() = envia direto para DESTINATARIO (altere o email abaixo).
 *   Use só quando tiver certeza do assunto e do destinatário.
 */

const ASSUNTO = 'Nova no Young Talents: exporte sua lista de candidatos em CSV, Excel ou PDF';
const DESTINATARIO = 'seu-cliente@exemplo.com'; // altere para o email do cliente (usado em enviarParaCliente)

const HTML_DO_EMAIL = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova funcionalidade — Exportação de candidatos | Young Talents</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f1f5f9; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 32px 40px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: #64748b; text-transform: uppercase;">Young Talents</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 8px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Nova funcionalidade no ar</h1>
              <p style="margin: 6px 0 0; font-size: 15px; color: #475569;">Exporte sua lista de candidatos filtrados em CSV, Excel ou PDF.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 24px;">
        <div style="height: 1px; background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%);"></div>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px;">
        <p style="margin: 0 0 20px; font-size: 15px; color: #334155;">Olá,</p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #334155;">Temos uma novidade na plataforma: agora você pode <strong>exportar a lista de candidatos</strong> que está vendo na tela, no formato que preferir.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
          <tr>
            <td style="padding: 16px 20px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #1e40af;">Onde usar</p>
              <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Banco de Talentos</strong> — botão "Exportar CSV" ao lado de Filtros. Exporta exatamente a lista que você está vendo (com filtros e busca).</p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #475569;"><strong>Relatórios</strong> — botão "Exportar candidatos (CSV)". Exporta os candidatos do período escolhido no relatório.</p>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #0f172a;">Formatos disponíveis</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 14px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; color: #334155; width: 33%;"><strong>CSV</strong> — abre no Excel</td>
            <td style="width: 8px;"></td>
            <td style="padding: 10px 14px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; color: #334155; width: 33%;"><strong>Excel</strong> — planilha .xlsx</td>
            <td style="width: 8px;"></td>
            <td style="padding: 10px 14px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; color: #334155; width: 33%;"><strong>PDF</strong> — para impressão</td>
          </tr>
        </table>
        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #0f172a;">Como usar</p>
        <ol style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: #475569;">
          <li style="margin-bottom: 6px;">Aplique os filtros (ou um filtro salvo) e vá ao Banco de Talentos ou Relatórios.</li>
          <li style="margin-bottom: 6px;">Clique em "Exportar CSV" ou "Exportar candidatos (CSV)".</li>
          <li style="margin-bottom: 6px;">Na janela, escolha o formato (CSV, Excel ou PDF) e marque as colunas que deseja no arquivo.</li>
          <li>Clique em Exportar — o arquivo será baixado na hora.</li>
        </ol>
        <p style="margin: 0; font-size: 14px; color: #64748b;">Os dados saem formatados em português (datas, Sim/Não, etc.) e o CSV abre corretamente no Excel.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 40px 32px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Qualquer dúvida ou sugestão, estamos à disposição.</p>
        <p style="margin: 16px 0 0; font-size: 14px; color: #0f172a; font-weight: 500;">Um abraço,<br>Equipe Adventure Labs</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Envia o email PARA VOCÊ MESMO. Depois você abre o email recebido,
 * clica em "Encaminhar", coloca o email do cliente e envia.
 * O HTML é preservado no encaminhamento.
 */
function enviarParaMim() {
  const meuEmail = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(meuEmail, ASSUNTO, 'Versão em texto: abra este email no Gmail para ver a versão em HTML.', {
    htmlBody: HTML_DO_EMAIL,
    name: 'Young Talents / Adventure Labs'
  });
  Logger.log('Email enviado para ' + meuEmail + '. Abra a caixa de entrada, abra o email e clique em Encaminhar para enviar ao cliente.');
}

/**
 * Envia direto para o DESTINATARIO definido no topo do script.
 * Altere a constante DESTINATARIO antes de executar.
 */
function enviarParaCliente() {
  GmailApp.sendEmail(DESTINATARIO, ASSUNTO, 'Versão em texto: abra este email no Gmail para ver a versão em HTML.', {
    htmlBody: HTML_DO_EMAIL,
    name: 'Young Talents / Adventure Labs'
  });
  Logger.log('Email enviado para ' + DESTINATARIO);
}
