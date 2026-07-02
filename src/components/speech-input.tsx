'use client'

import { useSpeechToText } from '@/hooks/use-speech-to-text'
import { useLanguage } from '@/lib/i18n'

interface SpeechInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  lang?: string
}

export function SpeechInput({ value, onChange, placeholder, className = '', lang = 'ar-IQ' }: SpeechInputProps) {
  const { t } = useLanguage()
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported } = useSpeechToText({ lang })

  const handleToggle = () => {
    if (isListening) {
      stopListening()
      if (transcript) {
        onChange(value ? `${value} ${transcript}` : transcript)
      }
    } else {
      startListening()
    }
  }

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <input
        type="text"
        value={isListening ? `${value} ${interimTranscript}` : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
      />
      {isSupported && (
        <button
          type="button"
          onClick={handleToggle}
          className={`shrink-0 rounded-lg p-2 transition-colors ${
            isListening 
              ? 'bg-red-100 text-red-600 animate-pulse' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          title={isListening ? t('stopRecording') : t('startRecording')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  )
}