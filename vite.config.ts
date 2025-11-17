import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// Determine which manifest to use based on APP_MODE
const appMode = process.env.VITE_APP_MODE || 'paid'
const manifestSource = appMode === 'free' ? 'manifest-free.json' : 'manifest-paid.json'

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
      name: 'copy-manifest',
      buildStart() {
        // Copy the appropriate manifest file to manifest.json during build
        const src = resolve(__dirname, 'public', manifestSource)
        const dest = resolve(__dirname, 'public', 'manifest.json')
        try {
          copyFileSync(src, dest)
          console.log(`[PWA] Copied ${manifestSource} to manifest.json for ${appMode} version`)
        } catch (error) {
          console.error(`[PWA] Failed to copy manifest:`, error)
        }
      },
    },
  ],
})