/*
  Warnings:

  - You are about to drop the `UserSavedCompany` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[symbol]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "UserSavedCompany" DROP CONSTRAINT "UserSavedCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "UserSavedCompany" DROP CONSTRAINT "UserSavedCompany_userId_fkey";

-- DropTable
DROP TABLE "UserSavedCompany";

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" SERIAL NOT NULL,
    "savedAt" TIMESTAMP(3),
    "unsavedAt" TIMESTAMP(3),
    "percentChangeThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "previousPrice" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "companySymbol" TEXT NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Watchlist_userId_companyId_idx" ON "Watchlist"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_symbol_key" ON "Company"("symbol");

-- CreateIndex
CREATE INDEX "Company_symbol_idx" ON "Company" USING HASH ("symbol");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User" USING HASH ("id");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
