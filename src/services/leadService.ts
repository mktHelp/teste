import type { LeadFormData } from '../types/lead';

/**
 * Envia o lead para o webhook definido em VITE_LEAD_ENDPOINT (.env).
 * Sem endpoint configurado, simula o envio (útil em desenvolvimento).
 *
 * Requisitos no n8n:
 *  - workflow ATIVO (a URL de produção /webhook/... só existe com ele ativo);
 *  - nó Webhook com método POST e "Allowed Origins (CORS)" = * ou o domínio da página.
 */
export async function submitLead(data: LeadFormData): Promise<void> {
  const endpoint = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined;

  const payload = {
    nome: data.nome.trim(),
    whatsapp: data.whatsapp.replace(/\D/g, ''),
    email: data.email.trim().toLowerCase(),
    cidade: data.cidade.trim(),
    uf: data.uf,
    possuiCapital: data.possuiCapital,
    origem: 'funil-quero-ser-franqueado',
    pagina: window.location.href,
    enviadoEm: new Date().toISOString(),
  };

  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.info('[lead simulado]', payload);
    return;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Falha ao enviar lead: ${res.status}`);
}
