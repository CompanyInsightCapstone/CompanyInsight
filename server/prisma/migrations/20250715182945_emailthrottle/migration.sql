/*
  Warnings:

  - You are about to drop the column `savedAt` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `unsavedAt` on the `Watchlist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Watchlist" DROP COLUMN "savedAt",
DROP COLUMN "unsavedAt",
ADD COLUMN     "lastNotifiedTime" TIMESTAMP(3);
