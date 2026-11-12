export type CapitalOption = 'sim' | 'nao' | 'ainda_nao_sei';

/** Rótulos legíveis (formulário, planilha e e-mail). */
export const CAPITAL_LABELS: Record<CapitalOption, string> = {
  sim: 'Sim',
  nao: 'Não',
  ainda_nao_sei: 'Ainda não sei',
};

export const CAPITAL_OPTIONS = Object.keys(CAPITAL_LABELS) as CapitalOption[];

export interface LeadFormData {
  nome: string;
  whatsapp: string;
  email: string;
  cidade: string;
  uf: string;
  possuiCapital: CapitalOption | '';
}

export type LeadFormErrors = Partial<Record<keyof LeadFormData, string>>;

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
