/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_APP_MODE?: 'full' | 'free'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
