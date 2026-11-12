import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initGTM } from './analytics/gtm';
import { trackFunnelView } from './analytics/events';
import { captureUtms } from './utils/utm';
import { flushPendingLeads } from './services/leadService';
import './styles/global.css';

captureUtms();
initGTM();
trackFunnelView();

// Reenvia, em segundo plano, leads que falharam em visitas anteriores
flushPendingLeads().then((n) => {
  if (n) console.info(`[lead] ${n} lead(s) pendente(s) reenviado(s)`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
