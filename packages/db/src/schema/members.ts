import { pgTable, text, boolean, timestamp, uuid, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { userRoleEnum } from "./enums.ts"
import { users } from "./users.ts"
import { centers } from "./centers.ts"

export const centerMembers = pgTable(
  "center_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    centerId: uuid("center_id").notNull().references(() => centers.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    canAccessChildren: boolean("can_access_children").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    unique("center_members_user_center_unique").on(table.userId, table.centerId),
  ]
).enableRLS()

export const centerMembersRelations = relations(centerMembers, ({ one }) => ({
  user: one(users, { fields: [centerMembers.userId], references: [users.id] }),
  center: one(centers, { fields: [centerMembers.centerId], references: [centers.id] }),
}))
