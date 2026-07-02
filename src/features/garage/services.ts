import { addVehicleSchema } from './validators'
import * as repo from './repository'

export async function addVehicle(userId: string, input: unknown) {
  const parsed = addVehicleSchema.parse(input)
  return repo.addUserVehicle({ ...parsed, userId })
}

export async function listUserVehicles(userId: string) {
  return repo.getUserVehicles(userId)
}

export async function removeVehicle(userId: string, vehicleId: string) {
  return repo.removeUserVehicle(userId, vehicleId)
}

export async function getPartsForVehicle(vehicleId: string, page = 1, limit = 20) {
  return repo.getCompatibleParts(vehicleId, page, limit)
}

export async function listMakes() {
  return repo.getMakes()
}

export async function listModels(make: string) {
  return repo.getModels(make)
}

export async function listYears(make: string, model: string) {
  return repo.getYears(make, model)
}
