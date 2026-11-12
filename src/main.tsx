import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initGTM } from './analytics/gtm';
import { trackFunnelView } from './analytics/events';
import { captureUtms } from './utils/utm';
import './styles/global.css';

captureUtms();
initGTM();
trackFunnelView();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
