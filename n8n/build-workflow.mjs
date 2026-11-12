/**
 * Gera n8n/workflow-captura-leads.json (importável no n8n).
 * Rodar:  node n8n/build-workflow.mjs
 *
 * Mantido como script para o HTML do e-mail e as colunas da planilha ficarem
 * legíveis e versionáveis, em vez de escondidos dentro de strings JSON.
 *
 * Fluxo:
 *   Webhook (POST) → Validar lead → Google Sheets (append or update por leadId)
 *     → Responder 200 ao formulário → Resend (e-mail de confirmação)
 *   Validar lead (inválido) → Responder 400
 *
 * O 200 só sai DEPOIS de gravar na planilha: se o Sheets falhar, o n8n responde 500
 * e o formulário tenta de novo / guarda o lead na fila local. O e-mail roda depois
 * da resposta e com "continuar em caso de erro": falha no e-mail nunca derruba o lead.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEBHOOK_PATH = 'f97f8177-3824-45c4-ae6a-bb4c90c34277';
const SHEET_TAB = 'Leads';
const B = "$('Webhook').item.json.body";

// Colunas da planilha (a 1ª linha da aba "Leads" deve ter exatamente estes cabeçalhos)
const columns = [
  ['leadId', `${B}.leadId`],
  ['recebidoEm', '$now.toISO()'],
  ['enviadoEm', `${B}.enviadoEm`],
  ['nome', `${B}.nome`],
  ['whatsapp', `${B}.whatsapp`],
  ['email', `${B}.email`],
  ['cidade', `${B}.cidade`],
  ['uf', `${B}.uf`],
  ['possuiCapital', `${B}.possuiCapitalLabel || ${B}.possuiCapital`],
  ['utm_source', `${B}.utm_source`],
  ['utm_medium', `${B}.utm_medium`],
  ['utm_campaign', `${B}.utm_campaign`],
  ['utm_content', `${B}.utm_content`],
  ['utm_term', `${B}.utm_term`],
  ['origem', `${B}.origem`],
  ['pagina', `${B}.pagina`],
];

const emailHtml = `
<div style="background:#F4F5F7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1A2936">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:24px;overflow:hidden">
    <div style="background:#1A2936;padding:28px 32px">
      <span style="display:inline-block;background:#FFD400;color:#1A2936;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px">Help Multas Franquias</span>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">Olá, {{PRIMEIRO_NOME}}! Recebemos seu interesse.</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D5161">
        Obrigado por querer fazer parte da rede Help Multas. Nosso time de expansão vai falar com você
        pelo WhatsApp <strong>{{WHATSAPP}}</strong> para apresentar o modelo de negócio.
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#5B6D7C">Próximos passos:</p>
      <ol style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.8;color:#1A2936">
        <li>Contato de um consultor de expansão</li>
        <li>Apresentação completa da franquia</li>
        <li>Análise do seu perfil e da sua região ({{CIDADE}}/{{UF}})</li>
      </ol>
      <p style="margin:0;font-size:13px;color:#8493A0">Se não foi você que preencheu o formulário, ignore este e-mail.</p>
    </div>
  </div>
</div>`.trim();

// Expressão n8n que monta o JSON do Resend escapando o que veio do formulário (evita HTML injection)
const resendBody = `={{ (() => {
  const b = ${B};
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const w = String(b.whatsapp ?? '').replace(/\\D/g, '');
  const whats = w.length === 11 ? '(' + w.slice(0, 2) + ') ' + w.slice(2, 7) + '-' + w.slice(7) : w;
  const html = ${JSON.stringify(emailHtml)}
    .replace('{{PRIMEIRO_NOME}}', esc(String(b.nome ?? '').trim().split(/\\s+/)[0]))
    .replace('{{WHATSAPP}}', esc(whats))
    .replace('{{CIDADE}}', esc(b.cidade))
    .replace('{{UF}}', esc(b.uf));
  return JSON.stringify({
    from: 'Help Multas Franquias <franquias@SEU-DOMINIO-VERIFICADO.com.br>',
    to: [b.email],
    subject: 'Recebemos seu interesse em ser franqueado Help Multas',
    html,
  });
})() }}`;

const workflow = {
  name: 'Funil Quero ser Franqueado — Captura de leads',
  nodes: [
    {
      id: 'b3a1c0de-0001-4000-8000-000000000001',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 300],
      webhookId: WEBHOOK_PATH,
      parameters: {
        httpMethod: 'POST',
        path: WEBHOOK_PATH,
        responseMode: 'responseNode',
        options: { allowedOrigins: '*' },
      },
    },
    {
      id: 'b3a1c0de-0002-4000-8000-000000000002',
      name: 'Validar lead',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [240, 300],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
          combinator: 'and',
          conditions: ['leadId', 'nome', 'whatsapp', 'email'].map((f, i) => ({
            id: `cond-${i + 1}`,
            leftValue: `={{ ${B}.${f} }}`,
            rightValue: '',
            operator: { type: 'string', operation: 'notEmpty', singleValue: true },
          })),
        },
        options: {},
      },
    },
    {
      id: 'b3a1c0de-0003-4000-8000-000000000003',
      name: 'Gravar no Google Sheets',
      type: 'n8n-nodes-base.googleSheets',
      typeVersion: 4.5,
      position: [480, 200],
      parameters: {
        operation: 'appendOrUpdate',
        documentId: { __rl: true, mode: 'id', value: 'COLE_AQUI_O_ID_DA_PLANILHA' },
        sheetName: { __rl: true, mode: 'name', value: SHEET_TAB },
        columns: {
          mappingMode: 'defineBelow',
          value: Object.fromEntries(columns.map(([col, expr]) => [col, `={{ ${expr} }}`])),
          matchingColumns: ['leadId'],
          schema: columns.map(([col]) => ({
            id: col,
            displayName: col,
            required: false,
            defaultMatch: false,
            display: true,
            type: 'string',
            canBeUsedToMatch: true,
          })),
        },
        // RAW: grava o texto como veio — "=FORMULA()" digitado no formulário não vira fórmula
        options: { cellFormat: 'RAW' },
      },
      credentials: { googleSheetsOAuth2Api: { id: '', name: 'Google Sheets (configurar)' } },
    },
    {
      id: 'b3a1c0de-0004-4000-8000-000000000004',
      name: 'Responder 200',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [720, 200],
      parameters: {
        respondWith: 'json',
        responseBody: `={{ { ok: true, leadId: ${B}.leadId } }}`,
        options: { responseCode: 200 },
      },
    },
    {
      id: 'b3a1c0de-0005-4000-8000-000000000005',
      name: 'E-mail de confirmação (Resend)',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [960, 200],
      onError: 'continueRegularOutput',
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000,
      parameters: {
        method: 'POST',
        url: 'https://api.resend.com/emails',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: resendBody,
        options: {},
      },
      credentials: { httpHeaderAuth: { id: '', name: 'Resend API (Authorization: Bearer re_...)' } },
    },
    {
      id: 'b3a1c0de-0006-4000-8000-000000000006',
      name: 'Responder 400',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [480, 420],
      parameters: {
        respondWith: 'json',
        responseBody: '={{ { ok: false, erro: "Campos obrigatórios ausentes: leadId, nome, whatsapp, email" } }}',
        options: { responseCode: 400 },
      },
    },
  ],
  connections: {
    Webhook: { main: [[{ node: 'Validar lead', type: 'main', index: 0 }]] },
    'Validar lead': {
      main: [
        [{ node: 'Gravar no Google Sheets', type: 'main', index: 0 }],
        [{ node: 'Responder 400', type: 'main', index: 0 }],
      ],
    },
    'Gravar no Google Sheets': { main: [[{ node: 'Responder 200', type: 'main', index: 0 }]] },
    'Responder 200': { main: [[{ node: 'E-mail de confirmação (Resend)', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
};

const out = join(dirname(fileURLToPath(import.meta.url)), 'workflow-captura-leads.json');
writeFileSync(out, JSON.stringify(workflow, null, 2) + '\n');
console.log(`Gerado: ${out}`);
