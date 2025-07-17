-- DropForeignKey
ALTER TABLE "CompanyDetails" DROP CONSTRAINT "CompanyDetails_companyId_companySymbol_fkey";

-- DropForeignKey
ALTER TABLE "CompanyNumericals" DROP CONSTRAINT "CompanyNumericals_companyId_companySymbol_fkey";

-- DropForeignKey
ALTER TABLE "Watchlist" DROP CONSTRAINT "Watchlist_companyId_companySymbol_fkey";

-- AddForeignKey
ALTER TABLE "CompanyDetails" ADD CONSTRAINT "CompanyDetails_companyId_companySymbol_fkey" FOREIGN KEY ("companyId", "companySymbol") REFERENCES "Company"("id", "symbol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyNumericals" ADD CONSTRAINT "CompanyNumericals_companyId_companySymbol_fkey" FOREIGN KEY ("companyId", "companySymbol") REFERENCES "Company"("id", "symbol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_companyId_companySymbol_fkey" FOREIGN KEY ("companyId", "companySymbol") REFERENCES "Company"("id", "symbol") ON DELETE CASCADE ON UPDATE CASCADE;
