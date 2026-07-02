'use client'

import { useState, useEffect } from 'react'
import { generateWhatsAppMessage, generateWhatsAppURL, type WhatsAppItem } from '@/lib/whatsapp'

export interface CartItem {
  partId: string
  partName: string
  partNumber: string
  storeId: string
  storeName: string
  storeWhatsapp: string
  storePhone: string
  price: number
  quantity: number
}

const STORAGE_KEY = 'cart_items'
const CUSTOMER_KEY = 'cart_customer'

export interface CustomerInfo {
  name: string
  phone: string
  city: string
  address: string
}

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

function readCustomer(): CustomerInfo {
  if (typeof window === 'undefined') return { name: '', phone: '', city: '', address: '' }
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}')
  } catch {
    return { name: '', phone: '', city: '', address: '' }
  }
}

function writeCustomer(customer: CustomerInfo) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
}

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const cart = readCart()
  const existing = cart.find((i) => i.partId === item.partId && i.storeId === item.storeId)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }
  writeCart(cart)
}

export function removeFromCart(partId: string, storeId: string) {
  const cart = readCart().filter((i) => !(i.partId === partId && i.storeId === storeId))
  writeCart(cart)
}

export function updateCartQuantity(partId: string, storeId: string, quantity: number) {
  const cart = readCart()
  const item = cart.find((i) => i.partId === partId && i.storeId === storeId)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(partId, storeId)
      return
    }
    item.quantity = quantity
    writeCart(cart)
  }
}

export function clearCart() {
  writeCart([])
}

export function getCartCount(): number {
  return readCart().reduce((sum, i) => sum + i.quantity, 0)
}

function groupByStore(items: CartItem[]): Map<string, CartItem[]> {
  const grouped = new Map<string, CartItem[]>()
  for (const item of items) {
    const existing = grouped.get(item.storeId)
    if (existing) {
      existing.push(item)
    } else {
      grouped.set(item.storeId, [item])
    }
  }
  return grouped
}

export default function CartButton() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>(() => readCart())
  const [customer, setCustomer] = useState<CustomerInfo>(() => readCustomer())
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  useEffect(() => {
    const handler = () => setItems(readCart())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  useEffect(() => {
    writeCustomer(customer)
  }, [customer])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const grouped = groupByStore(items)
  const grandTotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSendOrder = (storeId: string, storeItems: CartItem[]) => {
    const storeTotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const whatsappItems: WhatsAppItem[] = storeItems.map(item => ({
      name: item.partName,
      partNumber: item.partNumber,
      quantity: item.quantity,
      price: item.price,
    }))

    const message = generateWhatsAppMessage({
      storeName: storeItems[0].storeName,
      storePhone: storeItems[0].storePhone,
      storeWhatsApp: storeItems[0].storeWhatsapp,
      items: whatsappItems,
      customerName: customer.name || undefined,
      customerPhone: customer.phone || undefined,
      customerCity: customer.city || undefined,
      customerAddress: customer.address || undefined,
      totalAmount: storeTotal,
    })

    const url = generateWhatsAppURL(storeItems[0].storeWhatsapp || storeItems[0].storePhone, message)
    window.open(url, '_blank')
  }

  const handleSendAllOrders = () => {
    for (const [storeId, storeItems] of grouped) {
      handleSendOrder(storeId, storeItems)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors"
        aria-label="السلة"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-background p-6 shadow-xl sm:rounded-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">سلة المشتريات</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {count === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <div className="text-4xl mb-2">🛒</div>
                <p>السلة فارغة</p>
                <p className="text-xs mt-1">أضف قطع من صفحة البحث</p>
              </div>
            ) : (
              <>
                {/* Customer Info */}
                <div className="mb-4 rounded-xl border p-4">
                  <button
                    onClick={() => setShowCustomerForm(!showCustomerForm)}
                    className="flex w-full items-center justify-between text-sm font-medium"
                  >
                    <span>معلومات المشتري</span>
                    <span className="text-muted-foreground">{showCustomerForm ? '▲' : '▼'}</span>
                  </button>
                  {showCustomerForm && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <input
                        placeholder="الاسم"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                      />
                      <input
                        placeholder="الهاتف"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                      />
                      <input
                        placeholder="المدينة"
                        value={customer.city}
                        onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                      />
                      <input
                        placeholder="العنوان"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                      />
                    </div>
                  )}
                  {!showCustomerForm && customer.name && (
                    <p className="mt-1 text-xs text-muted-foreground">{customer.name} • {customer.city}</p>
                  )}
                </div>

                {/* Store Groups */}
                {Array.from(grouped.entries()).map(([storeId, storeItems]) => {
                  const storeTotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0)
                  return (
                    <div key={storeId} className="mb-4 rounded-xl border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-bold text-sm">{storeItems[0].storeName}</h3>
                        <span className="text-xs text-muted-foreground">{storeItems.length} قطع</span>
                      </div>
                      <div className="space-y-2">
                        {storeItems.map((item) => (
                          <div key={`${item.partId}-${item.storeId}`} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.partName}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{item.partNumber}</p>
                              <p className="text-xs font-bold">{(item.price * item.quantity).toLocaleString()} د.ع</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateCartQuantity(item.partId, item.storeId, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded border text-sm"
                              >−</button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.partId, item.storeId, item.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded border text-sm"
                              >+</button>
                              <button
                                onClick={() => removeFromCart(item.partId, item.storeId)}
                                className="mr-1 text-xs text-red-500 hover:text-red-700"
                              >✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <span className="text-sm font-bold">المجموع: {storeTotal.toLocaleString()} د.ع</span>
                        <button
                          onClick={() => handleSendOrder(storeId, storeItems)}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          إرسال
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Grand Total */}
                <div className="mb-4 rounded-xl bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">المجموع الكلي</span>
                    <span className="text-lg font-bold">{grandTotal.toLocaleString()} د.ع</span>
                  </div>
                </div>

                {/* Send All Button */}
                {grouped.size > 1 && (
                  <button
                    onClick={handleSendAllOrders}
                    className="mb-2 w-full rounded-lg bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700"
                  >
                    إرسال جميع الطلبات ({grouped.size} متاجر)
                  </button>
                )}

                <button
                  onClick={() => clearCart()}
                  className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  تفريغ السلة
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}