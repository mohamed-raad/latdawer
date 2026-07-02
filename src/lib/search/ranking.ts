export function calculateSearchScore(
  query: string,
  part: {
    partNumber: string | null
    oemNumber: string | null
    nameAr: string
    nameEn: string | null
    brand: string | null
    alternativeNames: string | null
  }
): number {
  const normalizedQuery = query.toLowerCase()
  let score = 0

  // Exact part number match (highest priority)
  if (part.partNumber?.toLowerCase() === normalizedQuery) {
    score += 100
  } else if (part.partNumber?.toLowerCase().includes(normalizedQuery)) {
    score += 80
  }

  // Exact OEM number match
  if (part.oemNumber?.toLowerCase() === normalizedQuery) {
    score += 90
  } else if (part.oemNumber?.toLowerCase().includes(normalizedQuery)) {
    score += 70
  }

  // Exact name match
  if (part.nameAr.toLowerCase().includes(normalizedQuery)) {
    score += 60
  }
  if (part.nameEn?.toLowerCase().includes(normalizedQuery)) {
    score += 50
  }

  // Brand match
  if (part.brand?.toLowerCase().includes(normalizedQuery)) {
    score += 40
  }

  // Alternative names match
  if (part.alternativeNames) {
    try {
      const alternatives = JSON.parse(part.alternativeNames)
      if (Array.isArray(alternatives)) {
        for (const alt of alternatives) {
          if (alt.toLowerCase().includes(normalizedQuery)) {
            score += 30
            break
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return score
}