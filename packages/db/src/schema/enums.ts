import { pgEnum } from "drizzle-orm/pg-core"

export const centerTypeEnum = pgEnum("center_type", [
  "commune",
  "satellite",
])

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "center_manager",
  "pharmacist",
  "doctor",
  "nurse",
])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "inward_supplier",
  "inward_transfer",
  "inward_return",
  "outward_prescription",
  "outward_transfer",
  "outward_disposal",
  "adjustment_increase",
  "adjustment_decrease",
])

export const dosageFormEnum = pgEnum("dosage_form", [
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "cream",
  "ointment",
  "drops",
  "powder",
  "suspension",
  "solution",
  "suppository",
  "inhaler",
  "patch",
  "gel",
  "other",
])

export const unitOfMeasureEnum = pgEnum("unit_of_measure", [
  "tablet",
  "capsule",
  "bottle",
  "ampoule",
  "vial",
  "tube",
  "sachet",
  "box",
  "strip",
  "ml",
  "g",
  "mg",
  "piece",
  "set",
])

export const alertTypeEnum = pgEnum("alert_type", [
  "expiry_warning",
  "expired",
  "low_stock",
  "out_of_stock",
  "overstock",
  "recall",
])

export const alertStatusEnum = pgEnum("alert_status", [
  "active",
  "acknowledged",
  "resolved",
  "dismissed",
])

export const storageConditionEnum = pgEnum("storage_condition", [
  "room_temperature",
  "cool",
  "refrigerated",
  "frozen",
  "controlled",
])

export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "pending",
  "partially_dispensed",
  "dispensed",
  "cancelled",
])

export const transferStatusEnum = pgEnum("transfer_status", [
  "pending",
  "in_transit",
  "received",
  "rejected",
])
