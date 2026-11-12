export type CapitalOption = 'sim' | 'nao';

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
