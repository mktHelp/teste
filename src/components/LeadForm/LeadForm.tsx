import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import type { LeadFormData, LeadFormErrors, SubmitStatus } from '../../types/lead';
import { UFS, maskWhatsapp, validateLead } from '../../utils/validation';
import { submitLead } from '../../services/leadService';
import {
  createLeadId,
  trackFormError,
  trackFormStart,
  trackFormView,
  trackLeadConversion,
  trackSubmitError,
} from '../../analytics/events';
import Icon from '../Icon';
import styles from './LeadForm.module.css';

const initialData: LeadFormData = {
  nome: '',
  whatsapp: '',
  email: '',
  cidade: '',
  uf: '',
  possuiCapital: '',
};

const steps = ['Envie seus dados', 'Conversa com um consultor', 'Apresentação da franquia'];

const capitalOptions = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
] as const;

export default function LeadForm() {
  const [data, setData] = useState<LeadFormData>(initialData);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const sectionRef = useRef<HTMLElement>(null);

  // form_view: quando ao menos 40% da seção do formulário aparece na tela
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackFormView();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // form_start: primeiro foco em qualquer campo
  const handleFocus = (e: FocusEvent<HTMLFormElement>) => {
    const name = (e.target as EventTarget & { name?: string }).name;
    if (name) trackFormStart(name);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name as keyof LeadFormData;
    const next = field === 'whatsapp' ? maskWhatsapp(value) : value;

    setData((prev) => ({ ...prev, [field]: next }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateLead(data);
    setErrors(validation);

    const errorFields = Object.keys(validation);
    if (errorFields.length) {
      trackFormError(errorFields);
      document.querySelector<HTMLElement>(`[name="${errorFields[0]}"]`)?.focus();
      return;
    }

    setStatus('submitting');
    const leadId = createLeadId();
    try {
      await submitLead(data, leadId);
    } catch (err) {
      trackSubmitError(err instanceof Error ? err.message : 'erro desconhecido');
      setStatus('error');
      return;
    }

    // Conversão só depois da confirmação do webhook (evita conversão sem lead).
    // Falha de rastreamento nunca deve impedir a tela de sucesso.
    try {
      await trackLeadConversion(data, leadId);
    } catch (err) {
      console.warn('[gtm] falha ao registrar conversão', err);
    }
    setStatus('success');
    setData(initialData);
  };

  const a11y = (field: keyof LeadFormData) => ({
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  });

  // Função de render (não componente) para não remontar o input a cada tecla.
  const renderField = ({
    field,
    label,
    children,
  }: {
    field: keyof LeadFormData;
    label: string;
    children: ReactNode;
  }) => (
    <div className={`${styles.field} ${errors[field] ? styles.fieldError : ''}`}>
      <label htmlFor={field} className={styles.label}>
        {label}
      </label>
      {children}
      {errors[field] && (
        <p id={`${field}-error`} className={styles.msg} role="alert">
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <section ref={sectionRef} id="formulario" className={styles.section} aria-labelledby="form-title">
      <div className={`container ${styles.wrapper}`}>
        <div className={styles.intro}>
          <span className="section-eyebrow">02 · Próximo passo</span>
          <h2 id="form-title" className="section-title">
            Quero ser franqueado
          </h2>
          <p className="section-subtitle">
            Preencha seus dados e nosso time de expansão entrará em contato pelo WhatsApp para
            apresentar o modelo de negócio.
          </p>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s}>
                <span className={styles.stepNum}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.card}>
          {status === 'success' ? (
            <div className={styles.success} role="status">
              <span className={styles.successIcon}>
                <Icon name="check" size={28} strokeWidth={2.25} />
              </span>
              <h3>Cadastro recebido!</h3>
              <p>Em breve um consultor de expansão vai falar com você pelo WhatsApp.</p>
              <button type="button" className={styles.linkBtn} onClick={() => setStatus('idle')}>
                Enviar outro cadastro
              </button>
            </div>
          ) : (
            <form id="form-quero-ser-franqueado" className={styles.form} onSubmit={handleSubmit} onFocus={handleFocus} noValidate>
              {renderField({
                field: 'nome',
                label: 'Nome completo',
                children: (
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome e sobrenome"
                    value={data.nome}
                    onChange={handleChange}
                    className={styles.input}
                    {...a11y('nome')}
                  />
                ),
              })}

              {renderField({
                field: 'whatsapp',
                label: 'WhatsApp',
                children: (
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(00) 90000-0000"
                    value={data.whatsapp}
                    onChange={handleChange}
                    className={`${styles.input} ${styles.mono}`}
                    {...a11y('whatsapp')}
                  />
                ),
              })}

              {renderField({
                field: 'email',
                label: 'E-mail',
                children: (
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="voce@email.com"
                    value={data.email}
                    onChange={handleChange}
                    className={styles.input}
                    {...a11y('email')}
                  />
                ),
              })}

              <div className={styles.row}>
                {renderField({
                  field: 'cidade',
                  label: 'Cidade',
                  children: (
                    <input
                      id="cidade"
                      name="cidade"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Sua cidade"
                      value={data.cidade}
                      onChange={handleChange}
                      className={styles.input}
                      {...a11y('cidade')}
                    />
                  ),
                })}

                {renderField({
                  field: 'uf',
                  label: 'UF',
                  children: (
                    <select
                      id="uf"
                      name="uf"
                      autoComplete="address-level1"
                      value={data.uf}
                      onChange={handleChange}
                      className={`${styles.input} ${styles.select}`}
                      {...a11y('uf')}
                    >
                      <option value="" disabled>
                        UF
                      </option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  ),
                })}
              </div>

              <fieldset
                className={`${styles.fieldset} ${errors.possuiCapital ? styles.fieldError : ''}`}
                aria-describedby={errors.possuiCapital ? 'possuiCapital-error' : undefined}
              >
                <legend className={styles.label}>Possui capital para investir?</legend>
                <div className={styles.radioGroup}>
                  {capitalOptions.map((opt) => {
                    const checked = data.possuiCapital === opt.value;
                    return (
                      <label key={opt.value} className={`${styles.option} ${checked ? styles.optionOn : ''}`}>
                        <input
                          type="radio"
                          name="possuiCapital"
                          value={opt.value}
                          checked={checked}
                          onChange={handleChange}
                          className="visually-hidden"
                        />
                        <span className={`${styles.rd} ${checked ? styles.rdOn : ''}`} aria-hidden="true" />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
                {errors.possuiCapital && (
                  <p id="possuiCapital-error" className={styles.msg} role="alert">
                    {errors.possuiCapital}
                  </p>
                )}
              </fieldset>

              {status === 'error' && (
                <p className={styles.alert} role="alert">
                  Não foi possível enviar agora. Tente novamente em instantes.
                </p>
              )}

              <button
                type="submit"
                className={`btn btn-accent btn-lg ${status === 'submitting' ? 'btn-loading' : ''}`}
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? (
                  <>
                    <span className="spinner" /> Enviando…
                  </>
                ) : (
                  <>
                    Quero ser franqueado
                    <Icon name="arrow-right" size={18} strokeWidth={2.25} />
                  </>
                )}
              </button>

              <p className={styles.privacy}>
                <Icon name="lock" size={14} />
                Seus dados estão seguros e serão usados apenas para contato sobre a franquia (LGPD).
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
