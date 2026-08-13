/*
  Warnings:

  - The values [SINGLE,DOUBLE,TRIPLE,EMERGENCY] on the enum `RoomType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `capacity` on the `rooms` table. All the data in the column will be lost.
  - Made the column `floor` on table `rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "DischargeCondition" AS ENUM ('SEMBUH', 'MEMBAIK', 'RUJUK', 'MENINGGAL', 'APS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoomStatus" ADD VALUE 'CLEANING';
ALTER TYPE "RoomStatus" ADD VALUE 'RESERVED';

-- AlterEnum
BEGIN;
CREATE TYPE "RoomType_new" AS ENUM ('VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION');
ALTER TABLE "rooms" ALTER COLUMN "room_type" TYPE "RoomType_new" USING ("room_type"::text::"RoomType_new");
ALTER TYPE "RoomType" RENAME TO "RoomType_old";
ALTER TYPE "RoomType_new" RENAME TO "RoomType";
DROP TYPE "RoomType_old";
COMMIT;

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "capacity",
ADD COLUMN     "bed_capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "building" VARCHAR(50),
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "facilities" JSONB,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "room_name" VARCHAR(100),
ALTER COLUMN "floor" SET NOT NULL;

-- CreateTable
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_occupancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_occupancies_registration_number_key" ON "room_occupancies"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "room_occupancies_billing_id_key" ON "room_occupancies"("billing_id");

-- AddForeignKey
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupancies" ADD CONSTRAINT "room_occupancies_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
