export type SortBy = 'price' | 'relevance' | 'distance' | 'quantity'
export type SortOrder = 'asc' | 'desc'

export function sortResults<T extends Record<string, unknown>>(
  results: T[],
  sortBy: SortBy,
  sortOrder: SortOrder,
  userLocation?: { lat: number; lng: number }
): T[] {
  return [...results].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'price':
        comparison = (a.minPrice as number) - (b.minPrice as number)
        break
      case 'quantity':
        // We don't have quantity in search results, skip
        comparison = 0
        break
      case 'distance':
        if (userLocation && a.storeLat && a.storeLng && b.storeLat && b.storeLng) {
          const distA = calculateDistance(userLocation, { lat: a.storeLat as number, lng: a.storeLng as number })
          const distB = calculateDistance(userLocation, { lat: b.storeLat as number, lng: b.storeLng as number })
          comparison = distA - distB
        }
        break
      case 'relevance':
      default:
        comparison = (b.score as number) - (a.score as number)
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })
}

function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}