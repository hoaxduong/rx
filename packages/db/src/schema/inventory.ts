import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index,
  unique,
  date,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { centers } from "./centers.ts"
import { medicines } from "./medicines.ts"
import { suppliers } from "./suppliers.ts"

export const inventoryBatches = pgTable(
  "inventory_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centerId: uuid("center_id").notNull().references(() => centers.id),
    medicineId: uuid("medicine_id").notNull().references(() => medicines.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    batchNumber: text("batch_number").notNull(),
    manufacturingDate: date("manufacturing_date"),
    expiryDate: date("expiry_date").notNull(),
    manufacturingSource: text("manufacturing_source"),
    quantity: integer("quantity").notNull().default(0),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }),
    sellingPrice: numeric("selling_price", { precision: 15, scale: 2 }),
    invoiceNumber: text("invoice_number"),
    invoiceDate: date("invoice_date"),
    batchBarcode: text("batch_barcode"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("inventory_batches_center_medicine_idx").on(table.centerId, table.medicineId),
    index("inventory_batches_expiry_date_idx").on(table.expiryDate),
    index("inventory_batches_batch_number_idx").on(table.batchNumber),
  ]
).enableRLS()

export const stockThresholds = pgTable(
  "stock_thresholds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centerId: uuid("center_id").notNull().references(() => centers.id),
    medicineId: uuid("medicine_id").notNull().references(() => medicines.id),
    minimumQuantity: integer("minimum_quantity").notNull().default(0),
    maximumQuantity: integer("maximum_quantity"),
    reorderQuantity: integer("reorder_quantity"),
    expiryWarningDays: integer("expiry_warning_days").notNull().default(90),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    unique("stock_thresholds_center_medicine_unique").on(table.centerId, table.medicineId),
  ]
).enableRLS()

export const inventoryBatchesRelations = relations(inventoryBatches, ({ one }) => ({
  center: one(centers, { fields: [inventoryBatches.centerId], references: [centers.id] }),
  medicine: one(medicines, { fields: [inventoryBatches.medicineId], references: [medicines.id] }),
  supplier: one(suppliers, { fields: [inventoryBatches.supplierId], references: [suppliers.id] }),
}))

export const stockThresholdsRelations = relations(stockThresholds, ({ one }) => ({
  center: one(centers, { fields: [stockThresholds.centerId], references: [centers.id] }),
  medicine: one(medicines, { fields: [stockThresholds.medicineId], references: [medicines.id] }),
}))
