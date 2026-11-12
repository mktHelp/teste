import Icon, { type IconName } from '../Icon';
import styles from './Benefits.module.css';

interface Benefit {
  title: string;
  description: string;
  icon: IconName;
  tone: 'amber' | 'navy';
}

const benefits: Benefit[] = [
  {
    title: 'Modelo validado e lucrativo',
    description:
      'Processos testados em dezenas de unidades, com indicadores claros e acompanhamento de resultados.',
    icon: 'trending-up',
    tone: 'amber',
  },
  {
    title: 'Suporte de ponta a ponta',
    description:
      'Da implantação à operação: treinamento inicial, consultoria de campo e acompanhamento contínuo.',
    icon: 'users',
    tone: 'navy',
  },
  {
    title: 'Marketing que gera clientes',
    description:
      'Campanhas nacionais, materiais prontos e geração de demanda local para sua unidade crescer.',
    icon: 'megaphone',
    tone: 'amber',
  },
];

export default function Benefits() {
  return (
    <section className={styles.benefits} aria-labelledby="beneficios-title">
      <div className="container">
        <header className={styles.header}>
          <span className="section-eyebrow">01 · Benefícios</span>
          <h2 id="beneficios-title" className="section-title">
            Tudo o que você precisa para empreender com segurança
          </h2>
          <p className="section-subtitle">
            Você não começa do zero: entra em uma rede estruturada, com know-how e apoio em cada etapa.
          </p>
        </header>

        <ul className={styles.grid}>
          {benefits.map((b, i) => (
            <li key={b.title} className={styles.card}>
              <div className={styles.head}>
                <span className={`${styles.icon} ${styles[b.tone]}`}>
                  <Icon name={b.icon} />
                </span>
                <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className={styles.title}>{b.title}</h3>
              <p className={styles.description}>{b.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
