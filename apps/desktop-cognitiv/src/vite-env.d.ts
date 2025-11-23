/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_STT_API_URL: string
  readonly VITE_RAG_API_URL: string
  readonly VITE_ANTHROPIC_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI?: {
    minimizeWindow: () => Promise<void>
    maximizeWindow: () => Promise<void>
    closeWindow: () => Promise<void>
    setAutoLaunch: (enabled: boolean) => Promise<boolean>
    getAutoLaunch: () => Promise<boolean>
    getAppVersion: () => Promise<string>
    platform: string
    isElectron: boolean
  }
}
