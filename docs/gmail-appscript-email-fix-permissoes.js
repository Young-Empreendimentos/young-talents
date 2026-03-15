/**
 * Google Apps Script — Email ao cliente informando da correção (FIX) de permissões
 * Young Talents: ajuste de RLS no Supabase; quem tem acesso total.
 *
 * COMO USAR:
 * 1. Abra https://script.google.com e crie um novo projeto (ou use o existente de email HTML).
 * 2. Cole TODO este arquivo em Code.gs (ou crie um novo arquivo .gs e cole).
 * 3. (Opcional) Altere ASSUNTO_FIX e DESTINATARIO_FIX abaixo.
 * 4. Menu: Executar → enviarParaMim (ou enviarParaCliente).
 * 5. Autorize o acesso ao Gmail quando o Google pedir.
 *
 * enviarParaMim() = envia o email PARA VOCÊ. Abra na caixa de entrada, Encaminhar para o cliente.
 * enviarParaCliente() = envia direto para DESTINATARIO_FIX.
 */

const ASSUNTO_FIX = 'Young Talents — Correção aplicada: permissões e acesso ao sistema';
const DESTINATARIO_FIX = 'seu-cliente@exemplo.com'; // altere para o email do cliente (usado em enviarParaCliente)

const HTML_EMAIL_FIX = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Correção aplicada — Young Talents</title>
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
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Correção aplicada</h1>
              <p style="margin: 6px 0 0; font-size: 15px; color: #475569;">Ajuste de permissões no sistema — tudo funcionando normalmente.</p>
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
        <p style="margin: 0 0 20px; font-size: 15px; color: #334155;">Informamos que foi aplicada uma <strong>correção nas permissões</strong> do Young Talents. O problema que impedia algumas ações (como criar empresas ou acessar a tela de usuários) foi resolvido.</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
          <tr>
            <td style="padding: 16px 20px; background-color: #f0fdf4; border-radius: 10px; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #15803d;">O que foi corrigido</p>
              <p style="margin: 0; font-size: 14px; color: #475569;">As regras de segurança do banco (Supabase) foram ajustadas. Agora os usuários com acesso total conseguem criar e editar empresas, vagas, candidatos e gerenciar usuários sem erro de permissão.</p>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #0f172a;">Quem tem acesso total ao sistema</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">Estes e-mails têm permissão completa (criar/editar empresas, vagas, candidatos, usuários e log de atividades):</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 14px; color: #334155;">
          <tr><td style="padding: 8px 0;">• dev@adventurelabs.com.br (conta técnica)</td></tr>
          <tr><td style="padding: 8px 0;">• contato@adventurelabs.com.br (Adventure Labs)</td></tr>
          <tr><td style="padding: 8px 0;">• eduardo@youngempreendimentos.com.br (Eduardo Tebaldi)</td></tr>
        </table>

        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #0f172a;">O que fazer</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #475569;">Basta acessar o Young Talents com um dos e-mails acima. Não é necessário alterar senha ou configuração; o sistema já está liberado.</p>

        <p style="margin: 0; font-size: 14px; color: #64748b;">Se aparecer qualquer mensagem de permissão, avise-nos para conferirmos o seu usuário no sistema.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 40px 32px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Qualquer dúvida, estamos à disposição.</p>
        <p style="margin: 16px 0 0; font-size: 14px; color: #0f172a; font-weight: 500;">Um abraço,<br>Equipe Adventure Labs</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Envia o email PARA VOCÊ MESMO. Depois abra o email recebido,
 * clique em "Encaminhar", coloque o email do cliente e envie.
 */
function enviarParaMim() {
  const meuEmail = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(meuEmail, ASSUNTO_FIX, 'Versão em texto: abra este email no Gmail para ver a versão em HTML.', {
    htmlBody: HTML_EMAIL_FIX,
    name: 'Young Talents / Adventure Labs'
  });
  Logger.log('Email enviado para ' + meuEmail + '. Abra a caixa de entrada, abra o email e clique em Encaminhar para enviar ao cliente.');
}

/**
 * Envia direto para o DESTINATARIO_FIX definido no topo do script.
 * Altere a constante DESTINATARIO_FIX antes de executar.
 */
function enviarParaCliente() {
  GmailApp.sendEmail(DESTINATARIO_FIX, ASSUNTO_FIX, 'Versão em texto: abra este email no Gmail para ver a versão em HTML.', {
    htmlBody: HTML_EMAIL_FIX,
    name: 'Young Talents / Adventure Labs'
  });
  Logger.log('Email enviado para ' + DESTINATARIO_FIX);
}
