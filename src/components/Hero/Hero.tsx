import { brand } from '../../config/brand';
import { trackCtaClick } from '../../analytics/events';
import Icon from '../Icon';
import styles from './Hero.module.css';

// PLACEHOLDERS — substitua por números oficiais e comprováveis antes de publicar.
const stats = [
  { value: '+120', label: 'unidades no Brasil' },
  { value: '18m', label: 'payback médio' },
  { value: '92%', label: 'franqueados satisfeitos' },
];

const highlights = [
  'Modelo de negócio validado',
  'Treinamento e suporte contínuos',
  'Marketing nacional incluso',
  'Operação enxuta e escalável',
];

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <header className={`container ${styles.topbar}`}>
        <img
          src={brand.logoNegative}
          alt={brand.name}
          className={styles.logo}
          width={1671}
          height={496}
        />
        <a href="#formulario" className={`btn ${styles.topCta}`} onClick={() => trackCtaClick('topbar')}>
          Quero ser franqueado
        </a>
      </header>

      <div className={`container ${styles.content}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className="eyebrow-dot" />
            Franquia com vagas abertas
          </span>

          <h1 id="hero-title" className={styles.title}>
            Tenha seu próprio negócio com uma marca que <em>já deu certo</em>.
          </h1>

          <p className={styles.lede}>
            Seja um franqueado {brand.name} e conte com metodologia comprovada, suporte de ponta a
            ponta e uma rede que cresce junto com você.
          </p>

          <a href="#formulario" className="btn btn-accent btn-lg" onClick={() => trackCtaClick('hero')}>
            Quero ser franqueado
            <Icon name="arrow-right" size={18} strokeWidth={2.25} />
          </a>

          <ul className={styles.stats}>
            {stats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className={styles.card} aria-label="Destaques da franquia">
          <span className={styles.cardTag}>Por que investir agora</span>
          <ul className={styles.checklist}>
            {highlights.map((h) => (
              <li key={h}>
                <span className={styles.check}>
                  <Icon name="check" size={14} strokeWidth={2.5} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
