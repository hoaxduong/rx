import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  jsonb,
  index,
  date,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { transactionTypeEnum, transferStatusEnum } from "./enums.ts"
import { centers } from "./centers.ts"
import { suppliers } from "./suppliers.ts"
import { users } from "./users.ts"
import { inventoryBatches } from "./inventory.ts"
import { medicines } from "./medicines.ts"
import { prescriptions } from "./prescriptions.ts"

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionCode: text("transaction_code").notNull().unique(),
    type: transactionTypeEnum("type").notNull(),
    centerId: uuid("center_id").notNull().references(() => centers.id),
    targetCenterId: uuid("target_center_id").references(() => centers.id),
    transferStatus: transferStatusEnum("transfer_status"),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    invoiceNumber: text("invoice_number"),
    invoiceDate: date("invoice_date"),
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
    performedBy: uuid("performed_by").notNull().references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transactions_center_id_idx").on(table.centerId),
    index("transactions_type_idx").on(table.type),
    index("transactions_created_at_idx").on(table.createdAt),
  ]
).enableRLS()

export const transactionItems = pgTable(
  "transaction_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
    inventoryBatchId: uuid("inventory_batch_id").references(() => inventoryBatches.id),
    medicineId: uuid("medicine_id").notNull().references(() => medicines.id),
    batchNumber: text("batch_number"),
    expiryDate: date("expiry_date"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }),
    totalPrice: numeric("total_price", { precision: 15, scale: 2 }),
    stockBefore: integer("stock_before"),
    stockAfter: integer("stock_after"),
    notes: text("notes"),
  },
  (table) => [
    index("transaction_items_transaction_id_idx").on(table.transactionId),
    index("transaction_items_medicine_id_idx").on(table.medicineId),
  ]
).enableRLS()

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  center: one(centers, { fields: [transactions.centerId], references: [centers.id], relationName: "transaction_center" }),
  targetCenter: one(centers, { fields: [transactions.targetCenterId], references: [centers.id], relationName: "transaction_target_center" }),
  supplier: one(suppliers, { fields: [transactions.supplierId], references: [suppliers.id] }),
  performer: one(users, { fields: [transactions.performedBy], references: [users.id], relationName: "transaction_performer" }),
  approver: one(users, { fields: [transactions.approvedBy], references: [users.id], relationName: "transaction_approver" }),
  prescription: one(prescriptions, { fields: [transactions.prescriptionId], references: [prescriptions.id] }),
  items: many(transactionItems),
}))

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionItems.transactionId], references: [transactions.id] }),
  inventoryBatch: one(inventoryBatches, { fields: [transactionItems.inventoryBatchId], references: [inventoryBatches.id] }),
  medicine: one(medicines, { fields: [transactionItems.medicineId], references: [medicines.id] }),
}))
