import type { LeadFormData, LeadFormErrors } from '../types/lead';

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Máscara de celular brasileiro: (11) 91234-5678 */
export function maskWhatsapp(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(data: LeadFormData): LeadFormErrors {
  const errors: LeadFormErrors = {};

  const nome = data.nome.trim();
  if (!nome) errors.nome = 'Informe seu nome.';
  else if (nome.split(/\s+/).length < 2) errors.nome = 'Informe nome e sobrenome.';

  const phone = onlyDigits(data.whatsapp);
  if (!phone) errors.whatsapp = 'Informe seu WhatsApp.';
  else if (phone.length !== 11 || phone[2] !== '9') errors.whatsapp = 'Número inválido. Ex.: (11) 91234-5678';

  if (!data.email.trim()) errors.email = 'Informe seu e-mail.';
  else if (!EMAIL_RE.test(data.email.trim())) errors.email = 'E-mail inválido.';

  if (!data.cidade.trim()) errors.cidade = 'Informe sua cidade.';
  if (!data.uf) errors.uf = 'Obrigatório.';

  if (!data.possuiCapital) errors.possuiCapital = 'Selecione uma opção.';

  return errors;
}
