import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Service Workers require secure contexts (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.warn('[ServiceWorker] Service worker registration bypassed: insecure context.');
      return;
    }

    try {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[ServiceWorker] Registration successful. Scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[ServiceWorker] Registration rejected:', err);
        });
    } catch (err) {
      console.error('[ServiceWorker] Registration exception caught:', err);
    }
  });
}

