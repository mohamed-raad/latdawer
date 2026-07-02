import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح').max(15),
  city: z.string().min(1, 'يرجى اختيار المدينة'),
  area: z.string().min(1, 'يرجى إدخال اسم المنطقة'),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  role: z.enum(['Customer', 'StoreManager']).default('Customer'),
})

export const signInSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})
