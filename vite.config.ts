import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// Determine which manifest and favicon to use based on APP_MODE
const appMode = process.env.VITE_APP_MODE || 'paid'
const manifestSource = appMode === 'free' ? 'manifest-free.json' : 'manifest-paid.json'
const faviconSource = appMode === 'free' ? 'favicon-free.svg' : 'favicon-paid.svg'

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
    {
      name: 'copy-pwa-assets',
      buildStart() {
        // Copy the appropriate manifest file to manifest.json during build
        const manifestSrc = resolve(__dirname, 'public', manifestSource)
        const manifestDest = resolve(__dirname, 'public', 'manifest.json')
        try {
          copyFileSync(manifestSrc, manifestDest)
          console.log(`[PWA] Copied ${manifestSource} to manifest.json for ${appMode} version`)
        } catch (error) {
          console.error(`[PWA] Failed to copy manifest:`, error)
        }

        // Copy the appropriate favicon file to favicon.svg during build
        const faviconSrc = resolve(__dirname, 'public', faviconSource)
        const faviconDest = resolve(__dirname, 'public', 'favicon.svg')
        try {
          copyFileSync(faviconSrc, faviconDest)
          console.log(`[PWA] Copied ${faviconSource} to favicon.svg for ${appMode} version`)
        } catch (error) {
          console.error(`[PWA] Failed to copy favicon:`, error)
        }
      },
    },
  ],
})