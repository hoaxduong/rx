import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { alertTypeEnum, alertStatusEnum } from "./enums.ts"
import { centers } from "./centers.ts"
import { medicines } from "./medicines.ts"
import { inventoryBatches } from "./inventory.ts"
import { users } from "./users.ts"

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  centerId: uuid("center_id").notNull().references(() => centers.id),
  type: alertTypeEnum("type").notNull(),
  status: alertStatusEnum("status").notNull().default("active"),
  medicineId: uuid("medicine_id").references(() => medicines.id),
  inventoryBatchId: uuid("inventory_batch_id").references(() => inventoryBatches.id),
  title: text("title").notNull(),
  message: text("message"),
  metadata: jsonb("metadata"),
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const alertsRelations = relations(alerts, ({ one }) => ({
  center: one(centers, { fields: [alerts.centerId], references: [centers.id] }),
  medicine: one(medicines, { fields: [alerts.medicineId], references: [medicines.id] }),
  inventoryBatch: one(inventoryBatches, { fields: [alerts.inventoryBatchId], references: [inventoryBatches.id] }),
  acknowledger: one(users, { fields: [alerts.acknowledgedBy], references: [users.id] }),
}))
