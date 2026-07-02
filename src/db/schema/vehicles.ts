import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { parts } from './catalog'

export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  make: text('make').notNull(),
  makeAr: text('make_ar').notNull(),
  model: text('model').notNull(),
  modelAr: text('model_ar').notNull(),
  year: text('year').notNull(),
  engine: text('engine'),
  trim: text('trim'),
  region: text('region'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  makeIdx: index('vehicles_make_idx').on(table.make),
  modelIdx: index('vehicles_model_idx').on(table.model),
  yearIdx: index('vehicles_year_idx').on(table.year),
}))

export const compatibility = sqliteTable('compatibility', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  notes: text('notes'),
  notesAr: text('notes_ar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  compatibility: many(compatibility),
}))

export const compatibilityRelations = relations(compatibility, ({ one }) => ({
  part: one(parts, { fields: [compatibility.partId], references: [parts.id] }),
  vehicle: one(vehicles, { fields: [compatibility.vehicleId], references: [vehicles.id] }),
}))
