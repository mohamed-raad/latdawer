'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useLanguage } from '@/lib/i18n'
import { useSpeechToText } from '@/hooks/use-speech-to-text'

export default function AIAssistantPage() {
  const { } = useLanguage()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({ 
    lang: 'ar-IQ',
    onTranscript: (text) => setInput((prev) => prev + text)
  })

  const { data: conversations, refetch: refetchConversations } = trpc.ai.listConversations.useQuery()
  const { data: messages, refetch: refetchMessages } = trpc.ai.getMessages.useQuery(
    { conversationId: conversationId || '' },
    { enabled: !!conversationId }
  )

  const createConversationMutation = trpc.ai.createConversation.useMutation({
    onSuccess: (data) => {
      setConversationId(data.id)
      refetchConversations()
    }
  })

  const sendMessageMutation = trpc.ai.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages()
      setSending(false)
    },
    onError: () => setSending(false)
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !conversationId || sending) return
    setSending(true)
    sendMessageMutation.mutate({ conversationId, content: input.trim() })
    setInput('')
  }

  const handleNewChat = () => {
    createConversationMutation.mutate({})
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]" dir="rtl">
      <aside className="w-64 border-l bg-muted/30 p-4 flex flex-col">
        <button onClick={handleNewChat} className="mb-4 rounded-lg bg-foreground px-4 py-2 text-sm text-background">
          + محادثة جديدة
        </button>
        <div className="flex-1 overflow-auto space-y-1">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setConversationId(conv.id)}
              className={`w-full text-right rounded-lg px-3 py-2 text-sm transition-colors ${
                conversationId === conv.id ? 'bg-foreground/10 font-medium' : 'hover:bg-muted'
              }`}
            >
              {conv.title || 'محادثة جديدة'}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {!conversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-bold mb-2">مساعد قطع الغيار</h2>
              <p className="text-muted-foreground mb-4">أهلاً! أنا هنا أساعدك إدارة متجرك. قولي شنو عندك من قطع غيار وأنا أساعدك تضيفها.</p>
              <button onClick={handleNewChat} className="rounded-lg bg-foreground px-6 py-2 text-background">
                ابدأ محادثة
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                    msg.role === 'user' ? 'bg-foreground text-background' : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-end">
                  <div className="bg-muted rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                {isSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`rounded-lg px-3 py-2 ${isListening ? 'bg-red-500 text-white' : 'bg-muted'}`}
                  >
                    🎤
                  </button>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="rounded-lg bg-foreground px-6 py-2 text-sm text-background disabled:opacity-50"
                >
                  إرسال
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}