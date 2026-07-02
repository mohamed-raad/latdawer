import { getPartById, getPartByPartNumber } from './repository'

export async function getPartDetails(id: string) {
  return getPartById(id)
}

export async function getPartByNumber(partNumber: string) {
  return getPartByPartNumber(partNumber)
}
