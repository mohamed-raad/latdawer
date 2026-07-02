import { createRequestSchema, requestsQuerySchema, createOfferSchema, updateOfferStatusSchema } from './validators'
import * as repo from './repository'

export async function createRequest(userId: string, input: unknown) {
  const parsed = createRequestSchema.parse(input)
  return repo.insertRequest({ ...parsed, userId })
}

export async function getRequest(id: string) {
  return repo.getRequestById(id)
}

export async function listRequests(input: unknown, userId?: string) {
  const parsed = requestsQuerySchema.parse(input)
  return repo.getRequests({ ...parsed, userId })
}

export async function getOffers(requestId: string) {
  return repo.getOffersByRequest(requestId)
}

export async function createOffer(storeId: string, input: unknown) {
  const parsed = createOfferSchema.parse(input)
  return repo.insertOffer({ ...parsed, storeId })
}

export async function respondToOffer(userId: string, input: unknown) {
  const parsed = updateOfferStatusSchema.parse(input)
  const offer = await repo.getOfferById(parsed.offerId)
  if (!offer) throw new Error('العرض غير موجود')

  const req = await repo.getRequestById(offer.requestId)
  if (!req || req.userId !== userId) throw new Error('لا يمكنك الرد على هذا العرض')

  return repo.updateOfferStatus(parsed.offerId, parsed.status)
}
