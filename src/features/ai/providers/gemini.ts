import type { ProviderAdapter, ChatOptions, ChatResponse } from './types'

export const geminiAdapter: ProviderAdapter = {
  name: 'Google Gemini',
  slug: 'gemini',

  async chat(apiKey: string, options: ChatOptions): Promise<ChatResponse> {
    const model = options.model || 'gemini-2.0-flash'

    // Extract system prompt from messages
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const otherMessages = options.messages.filter((m) => m.role !== 'system')

    const contents = otherMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    }

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    }
  },

  async listModels(apiKey: string) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
    const data = await response.json()
    return (data.models || [])
      .filter((m: Record<string, unknown>) =>
        (m.supportedGenerationMethods as string[])?.includes('generateContent')
      )
      .map((m: Record<string, unknown>) => ({
        id: (m.name as string).replace('models/', ''),
        name: m.displayName as string,
      }))
  },
}
