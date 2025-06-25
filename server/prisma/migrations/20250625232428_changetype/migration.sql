/*
  Warnings:

  - Made the column `delistingDate` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "delistingDate" SET NOT NULL,
ALTER COLUMN "delistingDate" SET DEFAULT 'N/A';
