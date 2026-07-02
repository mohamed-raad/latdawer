'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

const originLabels: Record<string, string> = {
  GCC: 'خليجي', Iraq: 'عراقي', USA: 'أمريكي', Japan: 'ياباني',
  Europe: 'أوروبي', China: 'صيني', Korea: 'كوري',
  OEM: 'أصلي', Aftermarket: 'بديل', Original: 'أصلي', Compatible: 'متوافق',
}
const originColors: Record<string, string> = {
  GCC: 'bg-green-100 text-green-800', Iraq: 'bg-blue-100 text-blue-800',
  USA: 'bg-purple-100 text-purple-800', Japan: 'bg-red-100 text-red-800',
  Europe: 'bg-indigo-100 text-indigo-800', China: 'bg-yellow-100 text-yellow-800',
  Korea: 'bg-cyan-100 text-cyan-800',
  OEM: 'bg-green-100 text-green-800', Aftermarket: 'bg-amber-100 text-amber-800',
  Original: 'bg-green-100 text-green-800', Compatible: 'bg-gray-100 text-gray-800',
}

export default function VerifyPage() {
  const [barcode, setBarcode] = useState('')
  const [searchType, setSearchType] = useState<'barcode' | 'partNumber'>('barcode')
  const [searched, setSearched] = useState(false)

  const { data: part, isLoading } = trpc.parts.byNumber.useQuery(
    { partNumber: barcode.trim() },
    { enabled: searched && barcode.trim().length > 0 },
  )

  function handleSearch() {
    if (!barcode.trim()) return
    setSearched(true)
  }

  const inputPlaceholder = searchType === 'barcode' ? 'امسح الباركود أو أدخله...' : 'أدخل رقم القطعة...'

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">التحقق من القطعة</h1>
      <p className="mt-1 text-muted-foreground">تحقق من أصل ومصدر القطعة عبر الباركود أو رقم القطعة</p>

      <div className="mt-6 flex gap-2">
        <select value={searchType} onChange={(e) => { setSearchType(e.target.value as 'barcode' | 'partNumber'); setSearched(false) }} className="rounded-lg border px-3 py-3 text-sm outline-none">
          <option value="barcode">باركود</option>
          <option value="partNumber">رقم القطعة</option>
        </select>
        <input
          value={barcode}
          onChange={(e) => { setBarcode(e.target.value); setSearched(false) }}
          placeholder={inputPlaceholder}
          dir="ltr"
          className="flex-1 rounded-lg border px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-foreground/20"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
        />
        <button onClick={handleSearch} disabled={isLoading} className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">بحث</button>
      </div>

      {isLoading && <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />}

      {!isLoading && searched && part && (
        <div className="mt-6 rounded-xl border bg-background p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{part.nameAr}</h2>
              <p className="text-muted-foreground">{part.nameEn}</p>
            </div>
            {part.origin && (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${originColors[part.origin] || 'bg-gray-100 text-gray-800'}`}>
                {originLabels[part.origin] || part.origin}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">رقم القطعة:</span> <span dir="ltr" className="font-medium">{part.partNumber}</span></div>
            {part.oemNumber && <div><span className="text-muted-foreground">رقم OEM:</span> <span dir="ltr" className="font-medium">{part.oemNumber}</span></div>}
            {part.barcode && <div><span className="text-muted-foreground">الباركود:</span> <span dir="ltr" className="font-medium">{part.barcode}</span></div>}
            {part.brand && <div><span className="text-muted-foreground">العلامة:</span> <span className="font-medium">{part.brand}</span></div>}
            {part.manufacturer?.nameAr && <div><span className="text-muted-foreground">الشركة:</span> <span className="font-medium">{part.manufacturer.nameAr}</span></div>}
            {part.category?.nameAr && <div><span className="text-muted-foreground">التصنيف:</span> <span className="font-medium">{part.category.nameAr}</span></div>}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3">
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium text-green-800">القطعة مسجلة في قاعدة البيانات - مصدرها: {originLabels[part.origin || ''] || part.origin || 'غير محدد'}</span>
          </div>

          <Link href={`/parts/${part.id}`} className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">عرض التفاصيل</Link>
        </div>
      )}

      {!isLoading && searched && !part && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">✗</span>
            <span className="text-sm font-medium text-red-800">لم يتم العثور على القطعة. قد تكون غير مسجلة أو الرقم غير صحيح.</span>
          </div>
          <p className="mt-2 text-sm text-red-600">إذا كنت تاجراً، يمكنك إضافة هذه القطعة إلى قاعدة البيانات.</p>
          <Link href="/requests/new" className="mt-3 inline-block rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">طلب إضافة القطعة</Link>
        </div>
      )}

      <div className="mt-8 rounded-xl border bg-muted/30 p-6">
        <h3 className="font-bold text-sm">مستويات التحقق</h3>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p><span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-medium">أصلي</span> — قطعة أصلية من الوكيل أو المصنع</p>
          <p><span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">بديل</span> — قطعة بديلة بجودة عالية (Aftermarket)</p>
          <p><span className="rounded-full bg-gray-100 text-gray-800 px-2 py-0.5 text-xs font-medium">متوافق</span> — قطعة متوافقة مع المواصفات</p>
        </div>
      </div>
    </div>
  )
}
