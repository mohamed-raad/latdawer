export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a

  if (longer.length === 0) return 1.0

  const distance = calculateLevenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

export function isFuzzyMatch(
  query: string,
  target: string,
  threshold: number = 0.6
): boolean {
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedTarget = target.toLowerCase().trim()

  if (normalizedTarget.includes(normalizedQuery)) return true

  const words = normalizedQuery.split(/\s+/)
  for (const word of words) {
    if (normalizedTarget.includes(word)) return true
  }

  const similarity = calculateSimilarity(normalizedQuery, normalizedTarget)
  return similarity >= threshold
}

export function getFuzzyMatches(
  query: string,
  targets: string[],
  threshold: number = 0.6,
  maxResults: number = 5
): { target: string; similarity: number }[] {
  const results: { target: string; similarity: number }[] = []

  for (const target of targets) {
    const similarity = calculateSimilarity(query.toLowerCase(), target.toLowerCase())
    if (similarity >= threshold) {
      results.push({ target, similarity })
    }
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
}

export function generateSearchVariants(query: string): string[] {
  const variants: string[] = [query]

  const arabicNormalizeMap: Record<string, string[]> = {
    'ا': ['أ', 'إ', 'آ'],
    'ه': ['ة'],
    'ي': ['ى'],
    'ء': ['ؤ', 'ئ'],
  }

  const normalized = query
  for (const [base, variants_list] of Object.entries(arabicNormalizeMap)) {
    for (const variant of variants_list) {
      if (normalized.includes(variant)) {
        variants.push(normalized.replace(new RegExp(variant, 'g'), base))
      }
    }
  }

  if (query.length > 3) {
    for (let i = 0; i < query.length; i++) {
      const withoutChar = query.slice(0, i) + query.slice(i + 1)
      if (withoutChar.length > 0) {
        variants.push(withoutChar)
      }
    }

    for (let i = 0; i < query.length - 1; i++) {
      const swapped = query.slice(0, i) + query[i + 1] + query[i] + query.slice(i + 2)
      variants.push(swapped)
    }
  }

  return [...new Set(variants)]
}