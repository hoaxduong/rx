CREATE TYPE "public"."alert_status" AS ENUM('active', 'acknowledged', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('expiry_warning', 'expired', 'low_stock', 'out_of_stock', 'overstock', 'recall');--> statement-breakpoint
CREATE TYPE "public"."center_type" AS ENUM('commune', 'satellite');--> statement-breakpoint
CREATE TYPE "public"."dosage_form" AS ENUM('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'suspension', 'solution', 'suppository', 'inhaler', 'patch', 'gel', 'other');--> statement-breakpoint
CREATE TYPE "public"."prescription_status" AS ENUM('pending', 'partially_dispensed', 'dispensed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."storage_condition" AS ENUM('room_temperature', 'cool', 'refrigerated', 'frozen', 'controlled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('inward_supplier', 'inward_transfer', 'inward_return', 'outward_prescription', 'outward_transfer', 'outward_disposal', 'adjustment_increase', 'adjustment_decrease');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'in_transit', 'received', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measure" AS ENUM('tablet', 'capsule', 'bottle', 'ampoule', 'vial', 'tube', 'sachet', 'box', 'strip', 'ml', 'g', 'mg', 'piece', 'set');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'center_manager', 'pharmacist', 'doctor', 'nurse');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"type" "alert_type" NOT NULL,
	"status" "alert_status" DEFAULT 'active' NOT NULL,
	"medicine_id" uuid,
	"inventory_batch_id" uuid,
	"title" text NOT NULL,
	"message" text,
	"metadata" jsonb,
	"acknowledged_by" uuid,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid,
	"center_id" uuid,
	"previous_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" "center_type" NOT NULL,
	"parent_id" uuid,
	"address" text,
	"ward_code" text,
	"district_code" text,
	"province_code" text,
	"phone" text,
	"email" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"license_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "centers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"scope" text,
	"password" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"phone" text,
	"full_name_vi" text,
	"professional_license" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "center_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"can_access_children" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "center_members_user_center_unique" UNIQUE("user_id","center_id")
);
--> statement-breakpoint
ALTER TABLE "center_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "medicine_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_vi" text,
	"code" text NOT NULL,
	"parent_id" uuid,
	"description" text,
	CONSTRAINT "medicine_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "medicine_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_vi" text,
	"brand_name" text,
	"category_id" uuid,
	"active_ingredient" text,
	"dosage_form" "dosage_form",
	"strength" text,
	"unit" "unit_of_measure",
	"packaging_spec" text,
	"registration_number" text,
	"manufacturer" text,
	"country_of_origin" text,
	"storage_condition" "storage_condition" DEFAULT 'room_temperature',
	"is_narcotics" boolean DEFAULT false NOT NULL,
	"is_psychotropic" boolean DEFAULT false NOT NULL,
	"is_prescription_only" boolean DEFAULT false NOT NULL,
	"is_essential_drug" boolean DEFAULT false NOT NULL,
	"dinh_muc_bhyt" text,
	"barcode" text,
	"atc_code" text,
	"contraindications" text,
	"side_effects" text,
	"interactions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medicines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"address" text,
	"tax_id" text,
	"license_number" text,
	"certificates" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"supplier_id" uuid,
	"batch_number" text NOT NULL,
	"manufacturing_date" date,
	"expiry_date" date NOT NULL,
	"manufacturing_source" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(15, 2),
	"selling_price" numeric(15, 2),
	"invoice_number" text,
	"invoice_date" date,
	"batch_barcode" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stock_thresholds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"minimum_quantity" integer DEFAULT 0 NOT NULL,
	"maximum_quantity" integer,
	"reorder_quantity" integer,
	"expiry_warning_days" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_thresholds_center_medicine_unique" UNIQUE("center_id","medicine_id")
);
--> statement-breakpoint
ALTER TABLE "stock_thresholds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"inventory_batch_id" uuid,
	"medicine_id" uuid NOT NULL,
	"batch_number" text,
	"expiry_date" date,
	"quantity" integer NOT NULL,
	"unit_price" numeric(15, 2),
	"total_price" numeric(15, 2),
	"stock_before" integer,
	"stock_after" integer,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "transaction_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_code" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"center_id" uuid NOT NULL,
	"target_center_id" uuid,
	"transfer_status" "transfer_status",
	"supplier_id" uuid,
	"invoice_number" text,
	"invoice_date" date,
	"prescription_id" uuid,
	"performed_by" uuid NOT NULL,
	"approved_by" uuid,
	"total_amount" numeric(15, 2),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_code_unique" UNIQUE("transaction_code")
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"dosage_instruction" text,
	"duration" text,
	"frequency" text,
	"unit_price" numeric(15, 2),
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "prescription_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_code" text NOT NULL,
	"center_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"patient_name" text NOT NULL,
	"patient_dob" date,
	"patient_gender" text,
	"patient_insurance_id" text,
	"diagnosis" text,
	"diagnosis_code" text,
	"status" "prescription_status" DEFAULT 'pending' NOT NULL,
	"prescribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispensed_at" timestamp with time zone,
	"dispensed_by" uuid,
	"notes" text,
	CONSTRAINT "prescriptions_prescription_code_unique" UNIQUE("prescription_code")
);
--> statement-breakpoint
ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_inventory_batch_id_inventory_batches_id_fk" FOREIGN KEY ("inventory_batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_parent_id_centers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_members" ADD CONSTRAINT "center_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_members" ADD CONSTRAINT "center_members_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_categories" ADD CONSTRAINT "medicine_categories_parent_id_medicine_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."medicine_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_category_id_medicine_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."medicine_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_thresholds" ADD CONSTRAINT "stock_thresholds_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_thresholds" ADD CONSTRAINT "stock_thresholds_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_inventory_batch_id_inventory_batches_id_fk" FOREIGN KEY ("inventory_batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_target_center_id_centers_id_fk" FOREIGN KEY ("target_center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_dispensed_by_users_id_fk" FOREIGN KEY ("dispensed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_batches_center_medicine_idx" ON "inventory_batches" USING btree ("center_id","medicine_id");--> statement-breakpoint
CREATE INDEX "inventory_batches_expiry_date_idx" ON "inventory_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "inventory_batches_batch_number_idx" ON "inventory_batches" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "transaction_items_transaction_id_idx" ON "transaction_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_items_medicine_id_idx" ON "transaction_items" USING btree ("medicine_id");--> statement-breakpoint
CREATE INDEX "transactions_center_id_idx" ON "transactions" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");