import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { stores } from './users'
import { manufacturers } from './catalog'
import { vehicles } from './vehicles'
import { categories } from './catalog'

export const storeManufacturers = sqliteTable('store_manufacturers', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  manufacturerId: text('manufacturer_id').notNull().references(() => manufacturers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  storeIdIdx: index('store_mfrs_store_idx').on(table.storeId),
  manufacturerIdIdx: index('store_mfrs_mfr_idx').on(table.manufacturerId),
}))

export const storeVehicles = sqliteTable('store_vehicles', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  storeIdIdx: index('store_veh_store_idx').on(table.storeId),
  vehicleIdIdx: index('store_veh_veh_idx').on(table.vehicleId),
}))

export const storeCategories = sqliteTable('store_categories', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  storeIdIdx: index('store_cats_store_idx').on(table.storeId),
  categoryIdIdx: index('store_cats_cat_idx').on(table.categoryId),
}))

export const storeManufacturersRelations = relations(storeManufacturers, ({ one }) => ({
  store: one(stores, { fields: [storeManufacturers.storeId], references: [stores.id] }),
  manufacturer: one(manufacturers, { fields: [storeManufacturers.manufacturerId], references: [manufacturers.id] }),
}))

export const storeVehiclesRelations = relations(storeVehicles, ({ one }) => ({
  store: one(stores, { fields: [storeVehicles.storeId], references: [stores.id] }),
  vehicle: one(vehicles, { fields: [storeVehicles.vehicleId], references: [vehicles.id] }),
}))

export const storeCategoriesRelations = relations(storeCategories, ({ one }) => ({
  store: one(stores, { fields: [storeCategories.storeId], references: [stores.id] }),
  category: one(categories, { fields: [storeCategories.categoryId], references: [categories.id] }),
  vehicle: one(vehicles, { fields: [storeCategories.vehicleId], references: [vehicles.id] }),
}))
