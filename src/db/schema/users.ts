import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('Customer'),
  phone: text('phone'),
  city: text('city'),
  area: text('area'),
  gpsLat: text('gps_lat'),
  gpsLng: text('gps_lng'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  cityIdx: index('users_city_idx').on(table.city),
}))

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  address: text('address'),
  city: text('city'),
  gpsLat: text('gps_lat'),
  gpsLng: text('gps_lng'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  workingHours: text('working_hours'),
  logo: text('logo'),
  photos: text('photos'),
  verified: text('verified').notNull().default('pending'),
  rating: text('rating').default('0'),
  inventoryCount: text('inventory_count').default('0'),
  ownerId: text('owner_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const storeManagers = sqliteTable('store_managers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  stores: many(storeManagers),
}))

export const storesRelations = relations(stores, ({ many }) => ({
  managers: many(storeManagers),
}))

export const storeManagersRelations = relations(storeManagers, ({ one }) => ({
  user: one(users, { fields: [storeManagers.userId], references: [users.id] }),
  store: one(stores, { fields: [storeManagers.storeId], references: [stores.id] }),
}))
