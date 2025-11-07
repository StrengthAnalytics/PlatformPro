import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import memberstackDOM from '@memberstack/dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// IIFE to handle async initialization before rendering
(async () => {
  // Initialize Memberstack and wait for it to be ready before rendering the app
  const memberstack = await memberstackDOM.init({
    publicKey: "pk_6df128fc0c66f4626d0b",
  });
  window.memberstack = memberstack;

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Register the service worker for PWA functionality
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.ts')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
})();
