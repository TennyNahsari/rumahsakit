-- =============================================================================
-- INITALIZATION SQL FOR HOSPITAL INFORMATION SYSTEM (RUMAH SAKIT)
-- PostgreSQL Database Creation, User Role, Privileges & Full Schema Setup
-- =============================================================================

-- -----------------------------------------------------------------------------
-- LANGKAH 1: CREATION USER & DATABASE (Jalankan sebagai user 'postgres')
-- -----------------------------------------------------------------------------

-- Drop database & user jika ingin reset (Opsional, hapus komentar jika diperlukan):
-- DROP DATABASE IF EXISTS rumahsakit;
-- DROP USER IF EXISTS rumahsakit;

-- 1. Buat User / Role Database
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rumahsakit') THEN
        CREATE USER rumahsakit WITH PASSWORD 'rumahsakit123';
    END IF;
END $$;

-- 2. Buat Database
-- (Catatan: Jalankan perintah CREATE DATABASE secara terpisah jika di GUI client)
CREATE DATABASE rumahsakit OWNER rumahsakit;

-- 3. Grant Hak Akses Database ke User
GRANT ALL PRIVILEGES ON DATABASE rumahsakit TO rumahsakit;

-- -----------------------------------------------------------------------------
-- LANGKAH 2: SKEMA & TABEL (Pindah ke Database 'rumahsakit')
-- -----------------------------------------------------------------------------
\c rumahsakit

-- Grant Schema Public ke User rumahsakit
GRANT ALL ON SCHEMA public TO rumahsakit;
GRANT USAGE ON SCHEMA public TO rumahsakit;
GRANT CREATE ON SCHEMA public TO rumahsakit;

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'PHARMACY', 'LABORATORY', 'PATIENT');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "VisitType" AS ENUM ('GENERAL_CHECKUP', 'OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'MEDICAL_ACTION');
CREATE TYPE "QueueChannel" AS ENUM ('ONLINE_WEBSITE', 'ONSITE_LOKET');
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "RoomType" AS ENUM ('VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION');
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING', 'RESERVED');
CREATE TYPE "OccupancyStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT');
CREATE TYPE "DischargeCondition" AS ENUM ('SEMBUH', 'MEMBAIK', 'RUJUK', 'MENINGGAL', 'APS');
CREATE TYPE "BillingStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

-- 1. Table Users
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "department" VARCHAR(100),
    "phone" VARCHAR(30),
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 2. Table Patients
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "medical_record_no" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" VARCHAR(20),
    "address" TEXT,
    "emergency_contact" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- 3. Table Visits
CREATE TABLE "visits" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "visit_type" "VisitType" NOT NULL,
    "channel" "QueueChannel" NOT NULL DEFAULT 'ONSITE_LOKET',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "queue_number" VARCHAR(20),
    "queue_prefix" VARCHAR(20),
    "queue_number_formatted" VARCHAR(30),
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "called_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- 4. Table Medical Records
CREATE TABLE "medical_records" (
    "id" SERIAL NOT NULL,
    "visit_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "diagnosis_code" VARCHAR(20),
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "prescription" JSONB,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- 5. Table Medicines
CREATE TABLE "medicines" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(50) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "supplier_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- 6. Table Medicine Batches
CREATE TABLE "medicine_batches" (
    "id" SERIAL NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "batch_no" VARCHAR(50) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "expiry_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_batches_pkey" PRIMARY KEY ("id")
);

-- 7. Table Rooms
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "room_name" VARCHAR(100),
    "room_type" "RoomType" NOT NULL,
    "floor" INTEGER NOT NULL,
    "building" VARCHAR(50),
    "bed_capacity" INTEGER NOT NULL DEFAULT 1,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price_per_day" DECIMAL(12,2) NOT NULL,
    "facilities" JSONB,
    "description" TEXT,
    "images" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- 8. Table Room Occupancies
CREATE TABLE "room_occupancies" (
    "id" SERIAL NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "bed_number" INTEGER,
    "doctor_id" INTEGER NOT NULL,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_checkout_at" TIMESTAMP(3),
    "initial_diagnosis" TEXT,
    "care_class" VARCHAR(20),
    "checked_out_at" TIMESTAMP(3),
    "actual_days" INTEGER,
    "discharge_condition" "DischargeCondition",
    "final_diagnosis" TEXT,
    "discharge_notes" TEXT,
    "total_room_cost" DECIMAL(12,2),
    "billing_id" INTEGER,
    "status" "OccupancyStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_occupancies_pkey" PRIMARY KEY ("id")
);

-- 9. Table Billings
CREATE TABLE "billings" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "visit_id" INTEGER,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'UNPAID',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billings_pkey" PRIMARY KEY ("id")
);

-- 10. Table Audit Logs
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- 11. Table Polyclinics
CREATE TABLE "polyclinics" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "english_name" VARCHAR(100),
    "code" VARCHAR(20),
    "description" TEXT,
    "english_description" TEXT,
    "services" JSONB,
    "icon" VARCHAR(50) DEFAULT 'Stethoscope',
    "color" VARCHAR(100) DEFAULT 'bg-blue-50 text-[#0052CC] border-blue-200',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polyclinics_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "patients_medical_record_no_key" ON "patients"("medical_record_no");
CREATE UNIQUE INDEX "medicine_batches_medicine_id_batch_no_key" ON "medicine_batches"("medicine_id", "batch_no");
CREATE UNIQUE INDEX "rooms_room_number_key" ON "rooms"("room_number");
CREATE UNIQUE INDEX "room_occupancies_registration_number_key" ON "room_occupancies"("registration_number");
CREATE UNIQUE INDEX "room_occupancies_billing_id_key" ON "room_occupancies"("billing_id");
CREATE UNIQUE INDEX "polyclinics_name_key" ON "polyclinics"("name");
CREATE UNIQUE INDEX "polyclinics_code_key" ON "polyclinics"("code");

-- -----------------------------------------------------------------------------
-- FOREIGN KEYS
-- -----------------------------------------------------------------------------
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "visits" ADD CONSTRAINT "visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billings" ADD CONSTRAINT "billings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billings" ADD CONSTRAINT "billings_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- PRIVILEGES ASSIGNMENT FOR USER 'rumahsakit'
-- -----------------------------------------------------------------------------
GRANT ALL PRIVILEGES ON DATABASE rumahsakit TO rumahsakit;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rumahsakit;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rumahsakit;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rumahsakit;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rumahsakit;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rumahsakit;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rumahsakit;
