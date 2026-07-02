export function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')      // Alef variants → Alef
    .replace(/ة/g, 'ه')          // Ta Marbuta → Ha
    .replace(/ى/g, 'ي')          // Alef Maqsura → Ya
    .replace(/ؤ/g, 'ء')          // Hamza below → Hamza
    .replace(/ئ/g, 'ء')          // Hamza above → Hamza
    .replace(/ـ/g, '')           // Tatweel → remove
    .replace(/\s+/g, ' ')        // Multiple spaces → single space
    .trim()
}

export function normalizeSearchQuery(query: string): string {
  const normalized = normalizeArabic(query)
  return normalized
    .split(' ')
    .filter(word => word.length > 0)
    .join(' ')
}