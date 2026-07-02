import type { ProviderAdapter } from './types'
import { groqAdapter } from './groq'
import { geminiAdapter } from './gemini'
import { mistralAdapter } from './mistral'
import { nvidiaNimAdapter } from './nvidia-nim'

const adapters: Record<string, ProviderAdapter> = {
  groq: groqAdapter,
  gemini: geminiAdapter,
  mistral: mistralAdapter,
  'nvidia-nim': nvidiaNimAdapter,
}

export function getAdapter(slug: string): ProviderAdapter | undefined {
  return adapters[slug]
}

export function registerAdapter(adapter: ProviderAdapter) {
  adapters[adapter.slug] = adapter
}

export function listAdapters(): ProviderAdapter[] {
  return Object.values(adapters)
}

export type { ProviderAdapter, ChatMessage, ChatOptions, ChatResponse } from './types'
