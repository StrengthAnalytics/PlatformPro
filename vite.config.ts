import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: '',
      filename: 'service-worker.ts',
      manifest: false, // We're using our own manifest.json
      injectRegister: null, // We handle registration manually in index.tsx
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})