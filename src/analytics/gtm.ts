/**
 * Camada de Google Tag Manager.
 *
 * - Com VITE_GTM_ID definido: carrega o container real do GTM.
 * - Sem VITE_GTM_ID: MODO SIMULAÇÃO — o dataLayer funciona igual, mas nenhum
 *   script externo é carregado; os eventos aparecem no console e no painel de debug.
 *
 * Todos os eventos passam por `track()`, então o comportamento é idêntico nos dois modos.
 */

export type DataLayerEvent = { event: string } & Record<string, unknown>;

export interface LoggedEvent {
  id: number;
  time: Date;
  payload: DataLayerEvent;
}

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim() || '';

export const gtmId = GTM_ID;
export const isSimulation = !GTM_ID;

/** Painel de debug visível no modo simulação ou com ?gtm_debug=1 na URL. */
export const isDebugEnabled =
  isSimulation || new URLSearchParams(window.location.search).has('gtm_debug');

const history: LoggedEvent[] = [];
const listeners = new Set<(events: LoggedEvent[]) => void>();
let seq = 0;
let initialized = false;

function record(payload: DataLayerEvent) {
  history.unshift({ id: ++seq, time: new Date(), payload });
  listeners.forEach((fn) => fn([...history]));
}

export function initGTM() {
  if (initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  if (isSimulation) {
    console.info(
      '%c GTM %c modo simulação — defina VITE_GTM_ID para carregar o container real',
      'background:#FFD400;color:#1A2936;font-weight:700;border-radius:4px;padding:1px 4px',
      'color:inherit',
    );
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}

/** Envia um evento ao dataLayer (e ao painel/console no modo debug). */
export function track(event: string, params: Record<string, unknown> = {}) {
  const payload: DataLayerEvent = { event, ...params };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  record(payload);

  if (isDebugEnabled) {
    console.info(
      `%c dataLayer %c ${event}`,
      'background:#1A2936;color:#FFD400;font-weight:700;border-radius:4px;padding:1px 4px',
      'font-weight:700',
      params,
    );
  }
}

/** Dispara o evento só uma vez por carregamento de página. */
const onceKeys = new Set<string>();
export function trackOnce(key: string, event: string, params?: Record<string, unknown>) {
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  track(event, params);
}

export function subscribe(fn: (events: LoggedEvent[]) => void) {
  listeners.add(fn);
  fn([...history]);
  return () => {
    listeners.delete(fn);
  };
}

export function clearHistory() {
  history.length = 0;
  listeners.forEach((fn) => fn([]));
}
