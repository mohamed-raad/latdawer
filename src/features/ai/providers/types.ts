export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatResponse {
  content: string
  model: string
  tokensUsed: number
}

export interface ProviderAdapter {
  name: string
  slug: string
  chat(apiKey: string, options: ChatOptions): Promise<ChatResponse>
  listModels?(apiKey: string): Promise<Array<{ id: string; name: string }>>
}
