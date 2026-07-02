import { getWatchlistEntry, addWatchlistEntry, removeWatchlistEntry } from './repository'

export async function checkWatchlist(userId: string, partId: string) {
  const entry = await getWatchlistEntry(userId, partId)
  return { watching: !!entry, entry }
}

export async function addToWatchlist(userId: string, partId: string) {
  return addWatchlistEntry(userId, partId)
}

export async function removeFromWatchlist(userId: string, partId: string) {
  await removeWatchlistEntry(userId, partId)
  return { success: true }
}
