import type { ProviderAdapter, ChatOptions, ChatResponse } from './types'

export const groqAdapter: ProviderAdapter = {
  name: 'Groq',
  slug: 'groq',

  async chat(apiKey: string, options: ChatOptions): Promise<ChatResponse> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'llama3-8b-8192',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: options.model || 'llama3-8b-8192',
      tokensUsed: data.usage?.total_tokens || 0,
    }
  },

  async listModels(apiKey: string) {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) throw new Error(`Groq API error: ${response.status}`)
    const data = await response.json()
    return (data.data || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      name: (m.id as string).replace(/-/g, ' '),
    }))
  },
}
