import { CAPITAL_LABELS, type CapitalOption, type LeadFormData } from '../types/lead';
import { getUtms } from '../utils/utm';

/**
 * Envio de leads ao webhook (VITE_LEAD_ENDPOINT).
 *
 * Garantias para "nenhum lead se perder":
 *  1. Timeout por tentativa (15s) — não fica preso numa conexão travada.
 *  2. Até 3 tentativas com espera crescente para falha de rede, 408, 429 e 5xx.
 *  3. Idempotência: o mesmo `leadId` é reaproveitado em todos os reenvios, e o n8n
 *     faz "append or update" pela coluna leadId → reenvio nunca duplica linha.
 *  4. Fila local: se todas as tentativas falharem, o lead fica salvo neste navegador
 *     e é reenviado automaticamente na próxima visita (flushPendingLeads).
 *
 * Sem VITE_LEAD_ENDPOINT o envio é simulado (útil em desenvolvimento / dev:mock).
 */

export type LeadPayload = ReturnType<typeof buildLeadPayload>;

const ENDPOINT = (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined)?.trim() || '';
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;
const PENDING_KEY = 'hm_funil_pending_leads';
const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function buildLeadPayload(data: LeadFormData, leadId: string) {
  const capital = data.possuiCapital as CapitalOption;
  return {
    leadId,
    nome: data.nome.trim(),
    whatsapp: data.whatsapp.replace(/\D/g, ''),
    email: data.email.trim().toLowerCase(),
    cidade: data.cidade.trim(),
    uf: data.uf,
    possuiCapital: capital, // sim | nao | ainda_nao_sei
    possuiCapitalLabel: CAPITAL_LABELS[capital] ?? '',
    origem: 'funil-quero-ser-franqueado',
    ...getUtms(), // utm_source, utm_medium, utm_campaign, utm_content, utm_term ('' se ausente)
    pagina: window.location.href,
    enviadoEm: new Date().toISOString(),
  };
}

class RetryableError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postOnce(payload: LeadPayload): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    // Rede caiu, DNS, CORS ou timeout (AbortError): vale tentar de novo
    const reason = err instanceof Error && err.name === 'AbortError' ? 'timeout' : String(err);
    throw new RetryableError(`Falha de rede: ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  if (res.ok) return;
  const msg = `Falha ao enviar lead: HTTP ${res.status}`;
  // 4xx (exceto 408/429) = requisição inválida: repetir não resolve
  if (res.status === 408 || res.status === 429 || res.status >= 500) throw new RetryableError(msg);
  throw new Error(msg);
}

/** Envia com retry. Lança erro só depois de esgotar as tentativas. */
export async function sendLead(payload: LeadPayload): Promise<void> {
  if (!ENDPOINT && import.meta.env.PROD) {
    // Nunca simular em produção: o lead vai para a fila local e a falha fica visível
    console.error('[lead] VITE_LEAD_ENDPOINT ausente no build de produção — lead NÃO enviado');
    throw new Error('Webhook de leads não configurado');
  }

  if (!ENDPOINT) {
    await sleep(900);
    console.info('[lead simulado]', payload);
    return;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await postOnce(payload);
      return;
    } catch (err) {
      lastError = err;
      if (!(err instanceof RetryableError) || attempt === MAX_ATTEMPTS) break;
      await sleep(800 * 2 ** (attempt - 1)); // 0,8s → 1,6s
    }
  }
  throw lastError;
}

/* ---------------- Fila local de leads pendentes ---------------- */

type PendingEntry = { payload: LeadPayload; queuedAt: number };

function readPending(): PendingEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') as PendingEntry[];
    return list.filter((e) => Date.now() - e.queuedAt < PENDING_TTL_MS);
  } catch {
    return [];
  }
}

function writePending(list: PendingEntry[]) {
  try {
    if (list.length) localStorage.setItem(PENDING_KEY, JSON.stringify(list));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // storage indisponível (modo privado): nada a fazer
  }
}

/** Guarda o lead para reenvio (substitui se o mesmo leadId já estiver na fila). */
export function queuePendingLead(payload: LeadPayload) {
  const list = readPending().filter((e) => e.payload.leadId !== payload.leadId);
  list.push({ payload, queuedAt: Date.now() });
  writePending(list);
}

export function removePendingLead(leadId: string) {
  writePending(readPending().filter((e) => e.payload.leadId !== leadId));
}

/** Reenvia leads que falharam em visitas anteriores. Chamar no carregamento da página. */
export async function flushPendingLeads(): Promise<number> {
  const pending = readPending();
  if (!pending.length || !ENDPOINT) return 0; // sem endpoint: mantém na fila

  let sent = 0;
  for (const { payload } of pending) {
    try {
      await sendLead({ ...payload, reenviadoEm: new Date().toISOString() } as LeadPayload);
      removePendingLead(payload.leadId);
      sent++;
    } catch {
      // continua na fila para a próxima visita
    }
  }
  return sent;
}
