import { useEffect, useState } from 'react';
import { clearHistory, gtmId, isDebugEnabled, isSimulation, subscribe, type LoggedEvent } from '../../analytics/gtm';
import styles from './GtmDebugPanel.module.css';

const CONVERSION_EVENTS = new Set(['generate_lead']);

function formatTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour12: false });
}

/**
 * Painel flutuante que mostra os eventos enviados ao dataLayer.
 * Aparece no modo simulação (sem VITE_GTM_ID) ou com ?gtm_debug=1 na URL.
 */
export default function GtmDebugPanel() {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => subscribe(setEvents), []);

  if (!isDebugEnabled) return null;

  const conversions = events.filter((e) => CONVERSION_EVENTS.has(e.payload.event)).length;

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Debug do Google Tag Manager">
          <header className={styles.head}>
            <div>
              <p className={styles.title}>dataLayer</p>
              <p className={styles.sub}>
                {isSimulation ? 'Simulação · nenhum tag é disparado' : `Container ${gtmId}`}
              </p>
            </div>
            <div className={styles.headActions}>
              <button type="button" className={styles.ghost} onClick={clearHistory}>
                Limpar
              </button>
              <button type="button" className={styles.ghost} onClick={() => setOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
          </header>

          <div className={styles.summary}>
            <span>
              <strong>{events.length}</strong> eventos
            </span>
            <span className={conversions ? styles.convOn : ''}>
              <strong>{conversions}</strong> conversões
            </span>
          </div>

          <ol className={styles.list}>
            {events.length === 0 && <li className={styles.empty}>Nenhum evento ainda.</li>}
            {events.map((e) => {
              const { event, ...params } = e.payload;
              const isConv = CONVERSION_EVENTS.has(event);
              const isOpen = expanded === e.id;
              return (
                <li key={e.id} className={`${styles.item} ${isConv ? styles.itemConv : ''}`}>
                  <button
                    type="button"
                    className={styles.itemHead}
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.eventName}>{event}</span>
                    {isConv && <span className={styles.badge}>Conversão</span>}
                    <span className={styles.time}>{formatTime(e.time)}</span>
                  </button>
                  {isOpen && <pre className={styles.params}>{JSON.stringify(params, null, 2)}</pre>}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <button
        type="button"
        className={`${styles.fab} ${conversions ? styles.fabConv : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.fabDot} />
        GTM {isSimulation ? 'simulado' : 'debug'}
        <span className={styles.fabCount}>{events.length}</span>
      </button>
    </div>
  );
}
