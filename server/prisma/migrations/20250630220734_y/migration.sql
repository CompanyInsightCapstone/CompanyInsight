/*
  Warnings:

  - You are about to drop the `UserWatchlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserWatchlist" DROP CONSTRAINT "UserWatchlist_companyId_fkey";

-- DropForeignKey
ALTER TABLE "UserWatchlist" DROP CONSTRAINT "UserWatchlist_userId_fkey";

-- DropTable
DROP TABLE "UserWatchlist";

-- CreateTable
CREATE TABLE "UserSavedCompany" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "companySymbol" TEXT NOT NULL,

    CONSTRAINT "UserSavedCompany_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSavedCompany" ADD CONSTRAINT "UserSavedCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavedCompany" ADD CONSTRAINT "UserSavedCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
