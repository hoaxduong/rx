import { pgTable, text, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { dosageFormEnum, unitOfMeasureEnum, storageConditionEnum } from "./enums.ts"

export const medicineCategories = pgTable("medicine_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameVi: text("name_vi"),
  code: text("code").notNull().unique(),
  parentId: uuid("parent_id").references((): any => medicineCategories.id),
  description: text("description"),
}).enableRLS()

export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameVi: text("name_vi"),
  brandName: text("brand_name"),
  categoryId: uuid("category_id").references(() => medicineCategories.id),
  activeIngredient: text("active_ingredient"),
  dosageForm: dosageFormEnum("dosage_form"),
  strength: text("strength"),
  unit: unitOfMeasureEnum("unit"),
  packagingSpec: text("packaging_spec"),
  registrationNumber: text("registration_number"),
  manufacturer: text("manufacturer"),
  countryOfOrigin: text("country_of_origin"),
  storageCondition: storageConditionEnum("storage_condition").default("room_temperature"),
  isNarcotics: boolean("is_narcotics").notNull().default(false),
  isPsychotropic: boolean("is_psychotropic").notNull().default(false),
  isPrescriptionOnly: boolean("is_prescription_only").notNull().default(false),
  isEssentialDrug: boolean("is_essential_drug").notNull().default(false),
  dinhMucBhyt: text("dinh_muc_bhyt"),
  barcode: text("barcode"),
  atcCode: text("atc_code"),
  contraindications: text("contraindications"),
  sideEffects: text("side_effects"),
  interactions: jsonb("interactions"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}).enableRLS()

export const medicineCategoriesRelations = relations(medicineCategories, ({ one, many }) => ({
  parent: one(medicineCategories, {
    fields: [medicineCategories.parentId],
    references: [medicineCategories.id],
    relationName: "category_hierarchy",
  }),
  children: many(medicineCategories, { relationName: "category_hierarchy" }),
  medicines: many(medicines),
}))

export const medicinesRelations = relations(medicines, ({ one }) => ({
  category: one(medicineCategories, {
    fields: [medicines.categoryId],
    references: [medicineCategories.id],
  }),
}))
