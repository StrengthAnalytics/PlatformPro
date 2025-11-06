import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import memberstackDOM from '@memberstack/dom';

// Initialize Memberstack
window.memberstack = memberstackDOM.init({
  publicKey: "pk_6df128fc0c66f4626d0b",
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
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