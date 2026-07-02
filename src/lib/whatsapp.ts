export interface WhatsAppItem {
  name: string
  partNumber?: string
  quantity: number
  price?: number
  condition?: string
  notes?: string
}

export interface WhatsAppOrder {
  storeName: string
  storePhone: string
  storeWhatsApp: string
  items: WhatsAppItem[]
  customerName?: string
  customerPhone?: string
  customerCity?: string
  customerAddress?: string
  totalAmount: number
  notes?: string
}

export function generateWhatsAppMessage(order: WhatsAppOrder): string {
  const lines: string[] = []

  lines.push(`🛒 طلب جديد من ${order.storeName}`)
  lines.push('─'.repeat(30))
  lines.push('')

  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`)
    if (item.partNumber) lines.push(`   📦 الرقم: ${item.partNumber}`)
    lines.push(`   📊 الكمية: ${item.quantity}`)
    if (item.price) lines.push(`   💰 السعر: ${item.price.toLocaleString()} د.ع`)
    if (item.condition) lines.push(`   📋 الحالة: ${item.condition}`)
    if (item.notes) lines.push(`   📝 ملاحظات: ${item.notes}`)
    lines.push('')
  })

  lines.push('─'.repeat(30))
  lines.push(`💰 المجموع: ${order.totalAmount.toLocaleString()} د.ع`)
  lines.push('')

  if (order.customerName) lines.push(`👤 الاسم: ${order.customerName}`)
  if (order.customerPhone) lines.push(`📞 الهاتف: ${order.customerPhone}`)
  if (order.customerCity) lines.push(`🏙️ المدينة: ${order.customerCity}`)
  if (order.customerAddress) lines.push(`📍 العنوان: ${order.customerAddress}`)
  if (order.notes) lines.push(`📝 ملاحظات: ${order.notes}`)

  lines.push('')
  lines.push('─'.repeat(30))
  lines.push('تم الإرسال عبر تطبيق سنترال بارتس فايندر')

  return lines.join('\n')
}

export function generateWhatsAppURL(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function openWhatsApp(phone: string, message: string): void {
  const url = generateWhatsAppURL(phone, message)
  window.open(url, '_blank')
}

export function generateQuickInquiry(partName: string, partNumber?: string, _storePhone?: string): string {
  const lines: string[] = []
  lines.push('السلام عليكم')
  lines.push('')
  lines.push(`أبي أستفسر عن قطعة: ${partName}`)
  if (partNumber) lines.push(`رقم القطعة: ${partNumber}`)
  lines.push('')
  lines.push('شكد سعرها وهل عندكم منها؟')
  lines.push('')
  lines.push('شكورين')

  return lines.join('\n')
}

export function generateStoreContactMessage(storeName: string, itemQuery: string): string {
  const lines: string[] = []
  lines.push('السلام عليكم')
  lines.push('')
  lines.push(`أبي أستفسر من متجر ${storeName}`)
  lines.push('')
  lines.push(`عن: ${itemQuery}`)
  lines.push('')
  lines.push('شكد سعرها وهل عندكم منها؟')
  lines.push('')
  lines.push('شكورين')

  return lines.join('\n')
}