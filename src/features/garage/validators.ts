import { z } from 'zod'

export const addVehicleSchema = z.object({
  vehicleId: z.string().min(1, 'المركبة مطلوبة'),
  nickname: z.string().max(100).optional(),
  licensePlate: z.string().max(50).optional(),
})
