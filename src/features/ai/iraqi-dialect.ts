import { db } from '@/db'
import { aiKnowledgeBase } from '@/db/schema'
import { eq } from 'drizzle-orm'

const IRAQI_DIALECT_MAP: Record<string, string> = {
  'بطانة فرامل': 'كلتش فرامل',
  'بواجي': 'شمعات',
  'شمعة احتراق': 'بوجي',
  'فلتر زيت': 'فلتر زيت',
  'بكرة دينمو': 'بكرة الدينمو',
  'دينمو': 'الدينمو',
  'بطارية': 'البطارية',
  'مكينة': 'الموتر',
  'محرك': 'الموتر',
  'مساحات': 'المساحات',
  'مكيف': 'التكييف',
  'رادياتر': 'الرادياتر',
  'شاحن': 'الشاحن',
  'كاوتش': 'الكاوتش',
  'جنط': 'الجنط',
  'أنوار': 'الأنوار',
  'مرآة': 'المرآة',
  'زجاج': 'الزجاج',
  'باب': 'الباب',
  'كبوت': 'الكبوت',
  'شنطة': 'الشنطة',
  'مقعد': 'الكرسي',
  'دركسون': 'الدركسون',
  'مروح': 'المروح',
  'سيور': 'السيور',
  'كمبروسر': 'الكمبروسر',
  'بستم': 'البستم',
  'دبوس': 'الدبوس',
  'برشام': 'البرشام',
  'برغي': 'البرغي',
  'صامولة': 'الصامولة',
  'مسمار': 'المسمار',
  'أوتوماتيك': 'أوتوماتيك',
  'يدوي': 'مانوال',
  'جديد': 'نو',
  'مستعمل': 'مستعمل',
  'مُجدد': 'مجدد',
  'تشليح': 'تشليح',
  'أصلي': 'أصلي',
  'بديل': 'بديل',
  'متوافق': 'يصلح',
  'سيارة': 'سيارة',
  'مركبة': 'سيارة',
  'شاحنة': 'شاحنة',
  'باص': 'باص',
  'موتوسيكل': 'موتو',
}

export async function rewriteToIraqiDialect(text: string): Promise<string> {
  if (!text) return text

  let result = text
  for (const [standard, iraqi] of Object.entries(IRAQI_DIALECT_MAP)) {
    result = result.replace(new RegExp(standard, 'gi'), iraqi)
  }
  return result
}

export async function getIraqiTerms(category?: string): Promise<Array<{ term: string; translation: string; category: string }>> {
  const rows = await db.select().from(aiKnowledgeBase)
  let filtered = rows
  if (category) {
    filtered = rows.filter((r) => r.category === category)
  }
  return filtered.map((r) => ({ term: r.term, translation: r.translation, category: r.category || '' }))
}

export async function addIraqiTerm(term: string, translation: string, cat: string) {
  const [existing] = await db.select().from(aiKnowledgeBase)
    .where(eq(aiKnowledgeBase.term, term))
    .limit(1)

  if (existing) {
    await db.update(aiKnowledgeBase)
      .set({ translation, category: cat })
      .where(eq(aiKnowledgeBase.term, term))
  } else {
    await db.insert(aiKnowledgeBase).values({
      id: crypto.randomUUID(),
      term,
      translation,
      category: cat,
      dialect: 'iq',
      verified: false,
      createdAt: new Date(),
    })
  }
}
