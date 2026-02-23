import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { prescriptionStatusEnum } from "./enums.ts"
import { centers } from "./centers.ts"
import { users } from "./users.ts"
import { medicines } from "./medicines.ts"

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionCode: text("prescription_code").notNull().unique(),
  centerId: uuid("center_id").notNull().references(() => centers.id),
  doctorId: uuid("doctor_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  patientDob: date("patient_dob"),
  patientGender: text("patient_gender"),
  patientInsuranceId: text("patient_insurance_id"),
  diagnosis: text("diagnosis"),
  diagnosisCode: text("diagnosis_code"),
  status: prescriptionStatusEnum("status").notNull().default("pending"),
  prescribedAt: timestamp("prescribed_at", { withTimezone: true }).notNull().defaultNow(),
  dispensedAt: timestamp("dispensed_at", { withTimezone: true }),
  dispensedBy: uuid("dispensed_by").references(() => users.id),
  notes: text("notes"),
}).enableRLS()

export const prescriptionItems = pgTable("prescription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id),
  quantity: integer("quantity").notNull(),
  dosageInstruction: text("dosage_instruction"),
  duration: text("duration"),
  frequency: text("frequency"),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }),
  notes: text("notes"),
}).enableRLS()

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  center: one(centers, { fields: [prescriptions.centerId], references: [centers.id] }),
  doctor: one(users, { fields: [prescriptions.doctorId], references: [users.id], relationName: "prescription_doctor" }),
  dispenser: one(users, { fields: [prescriptions.dispensedBy], references: [users.id], relationName: "prescription_dispenser" }),
  items: many(prescriptionItems),
}))

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, { fields: [prescriptionItems.prescriptionId], references: [prescriptions.id] }),
  medicine: one(medicines, { fields: [prescriptionItems.medicineId], references: [medicines.id] }),
}))
