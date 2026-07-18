import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { parts, inventory, stores } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// Telegram Bot API helper
async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup || {} }),
  })
}

// Conversation state store (in-memory for simplicity, use KV in production)
const conversations = new Map<number, { step: string; data: Record<string, unknown> }>()

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    const message = update.message || update.callback_query?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text || update.callback_query?.data || ''
    const userId = message.from?.id?.toString() || ''

    // Check if user has a store
    const [storeManager] = await db.select().from((await import('@/db/schema')).storeManagers)
      .where(eq((await import('@/db/schema')).storeManagers.userId, userId))
      .limit(1)

    if (!storeManager) {
      await sendTelegramMessage(chatId, 'مرحباً! ما عندك متجر مسجل.\nسجّل متجرك أولاً: https://latdawer.mr991199.workers.dev/signup\n\nأو اكتب /start للبدء.')
      return NextResponse.json({ ok: true })
    }

    const storeId = storeManager.storeId
    const state = conversations.get(chatId) || { step: 'idle', data: {} }

    // Handle commands
    if (text === '/start' || text === '/help') {
      await sendTelegramMessage(chatId,
        'مرحباً بيك! أنا بوت لاتدور 🚗\n\n' +
        'أوامر:`n' +
        '/add - إضافة قطعة للمخزون`n' +
        '/list - عرض المخزون`n' +
        '/price - تغيير سعر`n' +
        '/stock - تحديث الكمية`n' +
        '/help - هذه القائمة`n`n' +
        'اكتب أي أمر وأنا أساعدك!'
      )
      conversations.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle /list - show inventory
    if (text === '/list') {
      const items = await db.select({
        partName: parts.nameAr,
        price: inventory.price,
        quantity: inventory.quantity,
      })
        .from(inventory)
        .innerJoin(parts, eq(inventory.partId, parts.id))
        .where(eq(inventory.storeId, storeId))
        .limit(20)

      if (items.length === 0) {
        await sendTelegramMessage(chatId, 'ماكو قطع في مخزونك.\nاكتب /add لإضافة قطعة.')
      } else {
        const list = items.map((item, i) =>
          `${i + 1}. ${item.partName} - ${item.price.toLocaleString()} د.ع (${item.quantity} قطعة)`
        ).join('\n')
        await sendTelegramMessage(chatId, `مخزونك (${items.length} قطعة):\n\n${list}`)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle /add - start adding inventory
    if (text === '/add') {
      state.step = 'add_name'
      state.data = {}
      conversations.set(chatId, state)
      await sendTelegramMessage(chatId, 'اكتب اسم القطعة بالعربي أو الإنجليزي:')
      return NextResponse.json({ ok: true })
    }

    // Handle /price - update price
    if (text === '/price') {
      state.step = 'price_name'
      state.data = {}
      conversations.set(chatId, state)
      await sendTelegramMessage(chatId, 'اكتب اسم القطعة:')
      return NextResponse.json({ ok: true })
    }

    // Handle /stock - update quantity
    if (text === '/stock') {
      state.step = 'stock_name'
      state.data = {}
      conversations.set(chatId, state)
      await sendTelegramMessage(chatId, 'اكتب اسم القطعة:')
      return NextResponse.json({ ok: true })
    }

    // Conversation flow for adding parts
    if (state.step === 'add_name') {
      // Search for part in catalog
      const partResults = await db.select().from(parts)
        .where(
          (await import('drizzle-orm')).or(
            eq(parts.nameAr, text),
            eq(parts.nameEn, text)
          )
        )
        .limit(5)

      if (partResults.length === 0) {
        await sendTelegramMessage(chatId, `ما لقيت "${text}" في الكتالوج.\nاكتب اسم القطعة بالضبط أو رقم القطعة.`)
      } else if (partResults.length === 1) {
        state.data.partId = partResults[0].id
        state.data.partName = partResults[0].nameAr
        state.step = 'add_price'
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `لقيت: ${partResults[0].nameAr}\nاكتب السعر بالدينار:`)
      } else {
        const options = partResults.map((p, i) => `${i + 1}. ${p.nameAr} (${p.nameEn})`).join('\n')
        state.data.options = partResults
        state.step = 'add_select'
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `لقيت ${partResults.length} قطع:\n${options}\n\nاكتب الرقم:`)
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
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `ممتاز: ${options[idx].nameAr}\nاكتب السعر بالدينار:`)
      } else {
        await sendTelegramMessage(chatId, 'اكتب رقم صحيح من القائمة.')
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'add_price') {
      const price = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(price) || price <= 0) {
        await sendTelegramMessage(chatId, 'اكتب سعر صحيح بالدينار.')
        return NextResponse.json({ ok: true })
      }
      state.data.price = price
      state.step = 'add_qty'
      conversations.set(chatId, state)
      await sendTelegramMessage(chatId, `السعر: ${price.toLocaleString()} د.ع\nاكتب الكمية:`)
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'add_qty') {
      const qty = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(qty) || qty <= 0) {
        await sendTelegramMessage(chatId, 'اكتب كمية صحيحة.')
        return NextResponse.json({ ok: true })
      }
      state.data.quantity = qty

      // Add to inventory
      const invId = crypto.randomUUID()
      await db.insert(inventory).values({
        id: invId,
        partId: state.data.partId as string,
        storeId,
        price: state.data.price as number,
        currency: 'IQD',
        quantity: qty,
        condition: 'new',
        status: 'active',
        notesAr: state.data.partName as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await sendTelegramMessage(chatId,
        `تمت الإضافة بنجاح! ✅\n\n` +
        `القطعة: ${state.data.partName}\n` +
        `السعر: ${(state.data.price as number).toLocaleString()} د.ع\n` +
        `الكمية: ${qty} قطعة\n\n` +
        `تقدر تشوف المخزون بكتابة /list`
      )
      conversations.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    // Conversation flow for updating price
    if (state.step === 'price_name') {
      const items = await db.select({ inventoryId: inventory.id, partName: parts.nameAr, price: inventory.price })
        .from(inventory)
        .innerJoin(parts, eq(inventory.partId, parts.id))
        .where(eq(inventory.storeId, storeId))

      const matched = items.filter(i => i.partName?.includes(text) || text.includes(i.partName || ''))
      if (matched.length === 0) {
        await sendTelegramMessage(chatId, `ما لقيت "${text}" في مخزونك.\nاكتب /list لعرض المخزون.`)
      } else if (matched.length === 1) {
        state.data.inventoryId = matched[0].inventoryId
        state.data.oldPrice = matched[0].price
        state.step = 'price_new'
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `السعر الحالي: ${(matched[0].price || 0).toLocaleString()} د.ع\nاكتب السعر الجديد:`)
      } else {
        const options = matched.map((m, i) => `${i + 1}. ${m.partName} - ${(m.price || 0).toLocaleString()} د.ع`).join('\n')
        state.data.options = matched
        state.step = 'price_select'
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `لقيت ${matched.length} قطع:\n${options}\n\nاكتب الرقم:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'price_select') {
      const idx = parseInt(text) - 1
      const options = state.data.options as Array<{ inventoryId: string; partName: string; price: number }>
      if (options && idx >= 0 && idx < options.length) {
        state.data.inventoryId = options[idx].inventoryId
        state.data.oldPrice = options[idx].price
        state.step = 'price_new'
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `القطعة: ${options[idx].partName}\nالسعر الحالي: ${(options[idx].price || 0).toLocaleString()} د.ع\nاكتب السعر الجديد:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'price_new') {
      const newPrice = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(newPrice) || newPrice <= 0) {
        await sendTelegramMessage(chatId, 'اكتب سعر صحيح.')
        return NextResponse.json({ ok: true })
      }
      await db.update(inventory).set({ price: newPrice, updatedAt: new Date() })
        .where(eq(inventory.id, state.data.inventoryId as string))
      await sendTelegramMessage(chatId, `تم تحديث السعر! ✅\nالسعر الجديد: ${newPrice.toLocaleString()} د.ع`)
      conversations.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle /stock flow
    if (state.step === 'stock_name') {
      const items = await db.select({ inventoryId: inventory.id, partName: parts.nameAr, quantity: inventory.quantity })
        .from(inventory)
        .innerJoin(parts, eq(inventory.partId, parts.id))
        .where(eq(inventory.storeId, storeId))

      const matched = items.filter(i => i.partName?.includes(text) || text.includes(i.partName || ''))
      if (matched.length === 0) {
        await sendTelegramMessage(chatId, `ما لقيت "${text}" في مخزونك.`)
      } else if (matched.length === 1) {
        state.data.inventoryId = matched[0].inventoryId
        state.step = 'stock_new'
        conversations.set(chatId, state)
        await sendTelegramMessage(chatId, `الكمية الحالية: ${matched[0].quantity} قطعة\nاكتب الكمية الجديدة:`)
      }
      return NextResponse.json({ ok: true })
    }

    if (state.step === 'stock_new') {
      const newQty = parseInt(text.replace(/[^\d]/g, ''))
      if (isNaN(newQty) || newQty < 0) {
        await sendTelegramMessage(chatId, 'اكتب كمية صحيحة.')
        return NextResponse.json({ ok: true })
      }
      await db.update(inventory).set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(inventory.id, state.data.inventoryId as string))
      await sendTelegramMessage(chatId, `تم تحديث الكمية! ✅\nالكمية الجديدة: ${newQty} قطعة`)
      conversations.delete(chatId)
      return NextResponse.json({ ok: true })
    }

    // Default: unknown command
    await sendTelegramMessage(chatId,
      `ما فهمت. اكتب /help للأوامر المتاحة.\n\n` +
      `أو مباشرة:\n` +
      `/add - إضافة قطعة\n` +
      `/list - عرض المخزون\n` +
      `/price - تغيير سعر\n` +
      `/stock - تحديث الكمية`
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

// GET handler for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok', bot: 'latdawer' })
}
