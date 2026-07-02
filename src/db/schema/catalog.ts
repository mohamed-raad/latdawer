import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { inventory } from './inventory'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: text('parent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const manufacturers = sqliteTable('manufacturers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  slug: text('slug').notNull().unique(),
  country: text('country'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const parts = sqliteTable('parts', {
  id: text('id').primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  partNumber: text('part_number'),
  oemNumber: text('oem_number'),
  barcode: text('barcode'),
  categoryId: text('category_id').references(() => categories.id),
  manufacturerId: text('manufacturer_id').references(() => manufacturers.id),
  brand: text('brand'),
  origin: text('origin'),
  condition: text('condition').default('new'),
  tags: text('tags'),
  alternativeNames: text('alternative_names'),
  searchVector: text('search_vector'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  partNumberIdx: index('parts_part_number_idx').on(table.partNumber),
  oemNumberIdx: index('parts_oem_number_idx').on(table.oemNumber),
  nameArIdx: index('parts_name_ar_idx').on(table.nameAr),
  nameEnIdx: index('parts_name_en_idx').on(table.nameEn),
  brandIdx: index('parts_brand_idx').on(table.brand),
  manufacturerIdIdx: index('parts_manufacturer_id_idx').on(table.manufacturerId),
  categoryIdIdx: index('parts_category_id_idx').on(table.categoryId),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  parts: many(parts),
}))

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  parts: many(parts),
}))

export const partsRelations = relations(parts, ({ one, many }) => ({
  category: one(categories, { fields: [parts.categoryId], references: [categories.id] }),
  manufacturer: one(manufacturers, { fields: [parts.manufacturerId], references: [manufacturers.id] }),
  inventory: many(inventory),
}))
