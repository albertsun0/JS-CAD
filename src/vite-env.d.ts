/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY?: string
    readonly VITE_ANTHROPIC_API_KEY?: string
    readonly VITE_GOOGLE_API_KEY?: string
    readonly VITE_LLM_PROVIDER?: string
    readonly VITE_LLM_MODEL_OPENAI?: string
    readonly VITE_LLM_MODEL_ANTHROPIC?: string
    readonly VITE_LLM_MODEL_GOOGLE?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 