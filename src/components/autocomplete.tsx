'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface AutocompleteOption { value: string; label: string; labelAr?: string; subtitle?: string }

interface AutocompleteProps {
  value: string; onChange: (value: string) => void
  options: AutocompleteOption[] | ((query: string) => AutocompleteOption[] | Promise<AutocompleteOption[]>)
  placeholder?: string; label?: string; className?: string; disabled?: boolean
  onSelect?: (option: AutocompleteOption) => void
}

export function Autocomplete({ value, onChange, options, placeholder, label, className = '', disabled = false, onSelect }: AutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef(value)
  if (prevValueRef.current !== value) { prevValueRef.current = value; setQuery(value) }

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); return }
    try {
      const result = typeof options === 'function' ? await options(q) : options.filter((o) =>
        o.label.toLowerCase().includes(q.toLowerCase()) || (o.labelAr && o.labelAr.includes(q)) || o.value.toLowerCase().includes(q.toLowerCase())
      )
      setSuggestions(result.slice(0, 8))
    } catch { setSuggestions([]) }
  }, [options])

  useEffect(() => { const t = setTimeout(() => fetchSuggestions(query), 200); return () => clearTimeout(t) }, [query, fetchSuggestions])
  useEffect(() => { const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex((p) => Math.min(p + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex((p) => Math.max(p - 1, 0)) }
    else if (e.key === 'Enter' && highlightedIndex >= 0) { e.preventDefault(); selectOption(suggestions[highlightedIndex]) }
    else if (e.key === 'Escape') { setIsOpen(false) }
  }

  function selectOption(option: AutocompleteOption) {
    setQuery(option.label); onChange(option.value); onSelect?.(option); setIsOpen(false); setHighlightedIndex(-1)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setIsOpen(true); setHighlightedIndex(-1) }}
        onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={disabled}
        className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 transition-all" autoComplete="off" />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border bg-background shadow-lg max-h-60 overflow-auto">
          {suggestions.map((option, index) => (
            <li key={option.value}>
              <button type="button" onClick={() => selectOption(option)} onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 text-right text-sm transition-colors ${index === highlightedIndex ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                <div className="font-medium">{option.labelAr || option.label}</div>
                {option.subtitle && <div className="text-xs text-muted-foreground mt-0.5">{option.subtitle}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
