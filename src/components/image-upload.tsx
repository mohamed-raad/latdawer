'use client'

import { useState, useRef } from 'react'
import { useLanguage } from '@/lib/i18n'

interface ImageUploadProps {
  images: string[]
  onChange: (urls: string[]) => void
  max?: number
}

export function ImageUpload({ images, onChange, max = 10 }: ImageUploadProps) {
  const { t: _t } = useLanguage()
  const t = (k: string, fb?: string) => {
    const v = _t(k)
    return v === k ? (fb || k) : v
  }
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newImages = [...images]
    for (let i = 0; i < files.length && newImages.length < max; i++) {
      const formData = new FormData()
      formData.append('file', files[i])
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.url) newImages.push(data.url)
      } catch { /* skip failed uploads */ }
    }
    onChange(newImages)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function addUrl() {
    const url = urlRef.current?.value?.trim()
    if (!url || images.length >= max) return
    if (images.includes(url)) return
    onChange([...images, url])
    if (urlRef.current) urlRef.current.value = ''
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0 right-0 rounded-bl-lg bg-black/60 px-1.5 py-0.5 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {uploading ? '...' : '+'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
      <div className="flex gap-2">
        <input ref={urlRef} type="url" placeholder={t('imageUrl', 'رابط الصورة...')} className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none" />
        <button type="button" onClick={addUrl} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
          {t('add', 'إضافة')}
        </button>
      </div>
    </div>
  )
}
