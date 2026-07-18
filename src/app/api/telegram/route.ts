import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { parts, inventory, stores } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const convStore = new Map<number, { step: string; data: Record<string, unknown>; storeId?: string; authenticated?: boolean }>()

async function sendMsg(chatId: number, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    const msg = update.message || update.callback_query?.message
    if (!msg) return NextResponse.json({ ok: true })

    const chatId = msg.chat.id
    const text = (msg.text || update.callback_query?.data || '').trim()
    const userId = msg.from?.id?.toString() || ''
    const state = convStore.get(chatId) || { step: 'idle', data: {}, authenticated: false }

    // Handle /start
    if (text === '/start' || text === '/help') {
      state.step = 'auth_code'
      state.authenticated = false
      convStore.set(chatId, state)
      await sendMsg(chatId,
        'مرحباً بيك ببوت لاتدور! 🚗\n\n' +
        'اكتب كود المتجر السري المكون من 5 أرقام للدخول:\n\n' +
        'أو اكتب /help للمساعدة.'
      )
      return NextResponse.json({ ok: true })
    }

    // Handle /help
    if (text === '/help') {
      await sendMsg(chatId,
        '📋 أوامر البوت:\n\n' +
        '/add - إضافة قطعة للمخزون\n' +
        '/list - عرض المخزون\n' +
        '/price - تغيير سعر قطعة\n' +
        '/stock - تحديث الكمية\n' +
        '/search - البحث في الكتالوج\n' +
        '/help - هذه القائمة\n\n' +
        'اكتب أي أمر وأنا أساعدك!'
      )
      return NextResponse.json({ ok: true })
    }

    // Authentication flow
    if (state.step === 'auth_code') {
      const code = text.replace(/[^\d]/g, '')
      if (code.length !== 5) {
        await sendMsg(chatId, 'الكود يجب أن يكون 5 أرقام فقط. حاول مرة ثانية:')
        return NextResponse.json({ ok: true })
      }

      // Find store by matching the 5-digit code against store names or a dedicated code field
      // For now, match against store name hash or use a simple lookup
      const allStores = await db.select().from(stores).limit(50)
      let matchedStore = null

      for (const store of allStores) {
        // Generate a simple 5-digit code from store name
        const storeCode = generateStoreCode(store.name || store.nameAr || '')
        if (storeCode === code) {
          matchedStore = store
          break
        }
      }

      if (matchedStore) {
        // Verify the user is a manager of this store
        const [manager] = await db.select().from((await import('@/db/schema')).storeManagers)
          .where(and(
            eq((await import('@/db/schema')).storeManagers.storeId, matchedStore.id),
            eq((await import('@/db/schema')).storeManagers.userId, userId)
          ))
          .limit(1)

        if (manager) {
          state.storeId = matchedStore.id
          state.authenticated = true
          state.step = 'idle'
          convStore.set(chatId, state)
          await sendMsg(chatId,
            `تم التحقق بنجاح! ✅\n\n` +
            `مرحباً في متجر: ${matchedStore.nameAr || matchedStore.name}\n\n` +
            `اكتب /add لإضافة قطعة\n` +
            `اكتب /list لعرض المخزون\n` +
            `اكتب /price لتغيير سعر\n` +
            `اكتب /stock لتحديث الكمية`
          )
        } else {
          await sendMsg(chatId, 'الكود صحيح لكن أنت مو مسؤول هذا المتجر. تأكد من الكود.')
        }
      } else {
        await sendMsg(chatId, 'الكود غير صحيح. حاول مرة ثانية أو تواصل مع الإدارة.')
      }
      return NextResponse.json({ ok: true })
    }

    // Check authentication for all other commands
    if (!state.authenticated || !state.storeId) {
      await sendMsg(chatId, 'يجب تسجيل الدخول أولاً. اكتب /start')
      return NextResponse.json({ ok: true })
    }

    const storeId = state.storeId

    // Handle commands
    if (text === '/list') {
      const items = await db.select({ partName: parts.nameAr, price: inventory.price, quantity: inventory.quantity, condition: inventory.condition })
        .from(inventory).innerJoin(parts, eq(inventory.partId, parts.id))
        .where(eq(inventory.storeId, storeId)).limit(30)

      if (items.length === 0) {
        await sendMsg(chatId, 'ماكو قطع في مخزونك.\nاكتب /add لإضافة قطعة.')
      } else {
        const list = items.map((item, i) => `${i + 1}. ${item.partName} - ${(item.price || 0).toLocaleString()} د.ع (${item.quantity} قطعة)`).join('\n')
        await sendMsg(chatId, `📦 مخزونك (${items.length} قطعة):\n\n${list}`)
      }
      return NextResponse.json({ ok: true })
    }

    if (text === '/search') {
      state.step = 'search_query'
      convStore.set(chatId, state)
      await sendMsg(chatId, 'اكتب كلمة البحث في الكتالوج:')
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'search_query') {
      const results = await db.select().from(parts)
        .where(or(eq(parts.nameAr, text), eq(parts.nameEn, text)))
        .limit(10)

      if (results.length === 0) {
        await sendMsg(chatId, `ما لقيت نتائج لـ "${text}". حاول بكلمة ثانية.`)
      } else {
        const list = results.map((p, i) => `${i + 1}. ${p.nameAr} (${p.nameEn}) - ${p.partNumber || ''}`).join('\n')
        await sendMsg(chatId, `🔍 نتائج البحث (${results.length}):\n\n${list}\n\nاكتب /add لإضافة أي قطعة.`)
      }
      state.step = 'idle'
      convStore.set(chatId, state)
      return NextResponse.json({ ok: true })
    }

    if (text === '/add') {
      state.step = 'add_name'
      state.data = {}
      convStore.set(chatId, state)
      await sendMsg(chatId, 'اكتب اسم القطعة بالعربي أو الإنجليزي أو رقم القطعة:')
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'add_name') {
      const results = await db.select().from(parts)
        .where(or(eq(parts.nameAr, text), eq(parts.nameEn, text), eq(parts.partNumber, text)))
        .limit(5)

      if (results.length === 0) {
        await sendMsg(chatId, `ما لقيت "${text}" في الكتالوج.\nاكتب اسم القطعة بالضبط أو رقم القطعة.`)
        return NextResponse.json({ ok: true })
      }

      if (results.length === 1) {
        state.data.partId = results[0].id
        state.data.partName = results[0].nameAr
        state.step = 'add_price'
        convStore.set(chatId, state)
        await sendMsg(chatId, `لقيت: ${results[0].nameAr}\nاكتب السعر بالدينار:`)
      } else {
        const options = results.map((p, i) => `${i + 1}. ${p.nameAr} (${p.nameEn})`).join('\n')
        state.data.options = results
        state.step = 'add_select'
        convStore.set(chatId, state)
        await sendMsg(chatId, `لقيت ${results.length} قطع:\n${options}\n\nاكتب الرقم:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'add_select') {
      const idx = parseInt(text) - 1
      const options = state.data.options as Array<{ id: string; nameAr: string }>
      if (options && idx >= 0 && idx < options.length) {
        state.data.partId = options[idx].id
        state.data.partName = options[idx].nameAr
        state.step = 'add_price'
        convStore.set(chatId, state)
        await sendMsg(chatId, `ممتاز: ${options[idx].nameAr}\nاكتب السعر بالدينار:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'add_price') {
      const price = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(price) || price <= 0) { await sendMsg(chatId, 'اكتب سعر صحيح بالدينار.'); return NextResponse.json({ ok: true }) }
      state.data.price = price
      state.step = 'add_qty'
      convStore.set(chatId, state)
      await sendMsg(chatId, `السعر: ${price.toLocaleString()} د.ع\nاكتب الكمية:`)
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'add_qty') {
      const qty = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(qty) || qty <= 0) { await sendMsg(chatId, 'اكتب كمية صحيحة.'); return NextResponse.json({ ok: true }) }

      await db.insert(inventory).values({
        id: crypto.randomUUID(), partId: state.data.partId as string, storeId,
        price: state.data.price as number, currency: 'IQD', quantity: qty,
        condition: 'new', status: 'active', notesAr: state.data.partName as string,
        createdAt: new Date(), updatedAt: new Date(),
      })

      await sendMsg(chatId,
        `تمت الإضافة! ✅\n\nالقطعة: ${state.data.partName}\nالسعر: ${(state.data.price as number).toLocaleString()} د.ع\nالكمية: ${qty} قطعة\n\nاكتب /list لعرض المخزون`
      )
      convStore.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    if (text === '/price') {
      state.step = 'price_name'; state.data = {}; convStore.set(chatId, state)
      await sendMsg(chatId, 'اكتب اسم القطعة:')
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'price_name') {
      const items = await db.select({ id: inventory.id, name: parts.nameAr, price: inventory.price })
        .from(inventory).innerJoin(parts, eq(inventory.partId, parts.id))
        .where(eq(inventory.storeId, storeId))
      const matched = items.filter(i => (i.name || '').includes(text) || text.includes(i.name || ''))
      if (matched.length === 0) { await sendMsg(chatId, `ما لقيت "${text}". اكتب /list`); return NextResponse.json({ ok: true }) }
      if (matched.length === 1) {
        state.data.inventoryId = matched[0].id; state.step = 'price_new'; convStore.set(chatId, state)
        await sendMsg(chatId, `السعر الحالي: ${(matched[0].price || 0).toLocaleString()} د.ع\nاكتب السعر الجديد:`)
      } else {
        const opts = matched.map((m, i) => `${i + 1}. ${m.name} - ${(m.price || 0).toLocaleString()} د.ع`).join('\n')
        state.data.options = matched; state.step = 'price_select'; convStore.set(chatId, state)
        await sendMsg(chatId, `لقيت ${matched.length} قطع:\n${opts}\n\nاكتب الرقم:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'price_select') {
      const idx = parseInt(text) - 1
      const options = state.data.options as Array<{ id: string; name: string; price: number }>
      if (options && idx >= 0 && idx < options.length) {
        state.data.inventoryId = options[idx].id; state.step = 'price_new'; convStore.set(chatId, state)
        await sendMsg(chatId, `القطعة: ${options[idx].name}\nالسعر الحالي: ${(options[idx].price || 0).toLocaleString()} د.ع\nاكتب السعر الجديد:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'price_new') {
      const newPrice = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(newPrice) || newPrice <= 0) { await sendMsg(chatId, 'اكتب سعر صحيح.'); return NextResponse.json({ ok: true }) }
      await db.update(inventory).set({ price: newPrice, updatedAt: new Date() }).where(eq(inventory.id, state.data.inventoryId as string))
      await sendMsg(chatId, `تم تحديث السعر! ✅\nالسعر الجديد: ${newPrice.toLocaleString()} د.ع`)
      convStore.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    if (text === '/stock') {
      state.step = 'stock_name'; state.data = {}; convStore.set(chatId, state)
      await sendMsg(chatId, 'اكتب اسم القطعة:')
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'stock_name') {
      const items = await db.select({ id: inventory.id, name: parts.nameAr, qty: inventory.quantity })
        .from(inventory).innerJoin(parts, eq(inventory.partId, parts.id))
        .where(eq(inventory.storeId, storeId))
      const matched = items.filter(i => (i.name || '').includes(text) || text.includes(i.name || ''))
      if (matched.length === 0) { await sendMsg(chatId, `ما لقيت "${text}". اكتب /list`); return NextResponse.json({ ok: true }) }
      if (matched.length === 1) {
        state.data.inventoryId = matched[0].id; state.step = 'stock_new'; convStore.set(chatId, state)
        await sendMsg(chatId, `الكمية الحالية: ${matched[0].qty} قطعة\nاكتب الكمية الجديدة:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'stock_new') {
      const newQty = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(newQty) || newQty < 0) { await sendMsg(chatId, 'اكتب كمية صحيحة.'); return NextResponse.json({ ok: true }) }
      await db.update(inventory).set({ quantity: newQty, updatedAt: new Date() }).where(eq(inventory.id, state.data.inventoryId as string))
      await sendMsg(chatId, `تم تحديث الكمية! ✅\nالكمية الجديدة: ${newQty} قطعة`)
      convStore.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    // Default
    await sendMsg(chatId, 'اكتب /help للأوامر المتاحة.')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

function generateStoreCode(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return String(Math.abs(hash) % 100000).padStart(5, '0')
}

export async function GET() {
  return NextResponse.json({ status: 'ok', bot: 'latdawer-v2' })
}
