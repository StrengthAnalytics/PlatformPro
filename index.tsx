import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Show helpful error message if Clerk key is missing
if (!PUBLISHABLE_KEY) {
  root.render(
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1e293b',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        backgroundColor: '#dc2626',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ⚠️ Configuration Error
        </h1>
        <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
          Missing <code style={{
            backgroundColor: '#991b1b',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable.
        </p>
        <p style={{ lineHeight: '1.6', fontSize: '0.875rem', opacity: 0.9 }}>
          If you're deploying to Vercel:
        </p>
        <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem', lineHeight: '1.8', fontSize: '0.875rem' }}>
          <li>Go to your Vercel project settings</li>
          <li>Navigate to "Environment Variables"</li>
          <li>Add: <code style={{
            backgroundColor: '#991b1b',
            padding: '0.125rem 0.375rem',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}>VITE_CLERK_PUBLISHABLE_KEY</code></li>
          <li>Set the value to your Clerk publishable key</li>
          <li>Redeploy your application</li>
        </ol>
      </div>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}

// Register the service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('[PWA] ServiceWorker registration successful with scope:', registration.scope);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available; please refresh.');
                // You can show a notification to the user here
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('[PWA] ServiceWorker registration failed:', error);
      });
  });
}
