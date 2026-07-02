import {
  getVehicleMakes,
  getVehicleModels,
  getVehicleYears,
  getPartsByVehicle,
  getVehiclesByPart,
  searchVehicles,
} from './repository'

export async function listMakes() {
  return getVehicleMakes()
}

export async function listModels(make: string) {
  return getVehicleModels(make)
}

export async function listYears(make: string, model: string) {
  return getVehicleYears(make, model)
}

export async function findPartsByVehicle(vehicleId: string) {
  return getPartsByVehicle(vehicleId)
}

export async function findVehiclesByPart(partId: string) {
  return getVehiclesByPart(partId)
}

export async function searchVehiclesService(query: string) {
  return searchVehicles(query)
}
