import type { LeadFormData } from '../types/lead';
import { getUtms } from '../utils/utm';
import { track, trackOnce } from './gtm';

/**
 * Eventos do funil "Quero ser franqueado".
 * Os nomes seguem os eventos recomendados do GA4 quando existem (generate_lead).
 *
 * Funil: funnel_view → cta_click → form_view → form_start → (form_error) → generate_lead
 */

const FORM_ID = 'quero-ser-franqueado';

export function trackFunnelView() {
  trackOnce('funnel_view', 'funnel_view', {
    funnel_name: 'quero_ser_franqueado',
    page_location: window.location.href,
    page_title: document.title,
    ...getUtms(),
  });
}

export function trackCtaClick(location: 'topbar' | 'hero') {
  track('cta_click', { cta_location: location, cta_text: 'Quero ser franqueado' });
}

export function trackFormView() {
  trackOnce('form_view', 'form_view', { form_id: FORM_ID });
}

export function trackFormStart(firstField: string) {
  trackOnce('form_start', 'form_start', { form_id: FORM_ID, first_field: firstField });
}

export function trackFormError(fields: string[]) {
  track('form_error', { form_id: FORM_ID, error_fields: fields.join(','), error_count: fields.length });
}

export function trackSubmitError(message: string) {
  track('form_submit_error', { form_id: FORM_ID, error_message: message });
}

/* ---------------- Conversão ---------------- */

async function sha256(value: string): Promise<string | undefined> {
  if (!value || !window.crypto?.subtle) return undefined;
  const bytes = new TextEncoder().encode(value);
  const hash = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function createLeadId(): string {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * CONVERSÃO — dispara `generate_lead` após o webhook confirmar o recebimento.
 *
 * Nenhum dado pessoal vai em texto puro para o dataLayer: e-mail e telefone seguem
 * apenas como hash SHA-256 normalizado (formato aceito pelas conversões otimizadas
 * do Google Ads / GA4 e pela API de Conversões da Meta).
 */
export async function trackLeadConversion(data: LeadFormData, leadId: string) {
  const email = data.email.trim().toLowerCase();
  const phoneE164 = `+55${data.whatsapp.replace(/\D/g, '')}`;

  const [emailHash, phoneHash] = await Promise.all([sha256(email), sha256(phoneE164)]);

  track('generate_lead', {
    form_id: FORM_ID,
    lead_id: leadId, // use como transaction_id / event_id para deduplicar
    lead_source: 'funil-quero-ser-franqueado',
    lead_uf: data.uf,
    lead_possui_capital: data.possuiCapital,
    lead_qualificado: data.possuiCapital === 'sim',
    currency: 'BRL',
    value: 0, // defina um valor por lead se for otimizar campanhas por valor
    ...getUtms(),
    user_data: {
      sha256_email_address: emailHash,
      sha256_phone_number: phoneHash,
    },
  });
}
