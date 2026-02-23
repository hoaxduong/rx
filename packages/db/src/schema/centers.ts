import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { centerTypeEnum } from "./enums.ts"

export const centers = pgTable("centers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: centerTypeEnum("type").notNull(),
  parentId: uuid("parent_id").references((): any => centers.id),
  address: text("address"),
  wardCode: text("ward_code"),
  districtCode: text("district_code"),
  provinceCode: text("province_code"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  licenseNumber: text("license_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}).enableRLS()

export const centersRelations = relations(centers, ({ one, many }) => ({
  parent: one(centers, {
    fields: [centers.parentId],
    references: [centers.id],
    relationName: "center_hierarchy",
  }),
  children: many(centers, { relationName: "center_hierarchy" }),
}))
