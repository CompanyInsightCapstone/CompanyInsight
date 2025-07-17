-- CreateTable
CREATE TABLE "CompanyDetails" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companySymbol" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3),
    "sector" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "CompanyNumericals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companySymbol" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3),
    "rawClose" DOUBLE PRECISION,
    "close" DOUBLE PRECISION,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "simpleMovingAverage" DOUBLE PRECISION,
    "smaStartDate" TIMESTAMP(3),
    "smaEndDate" TIMESTAMP(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDetails_id_key" ON "CompanyDetails"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyNumericals_id_key" ON "CompanyNumericals"("id");

-- AddForeignKey
ALTER TABLE "CompanyDetails" ADD CONSTRAINT "CompanyDetails_companyId_companySymbol_fkey" FOREIGN KEY ("companyId", "companySymbol") REFERENCES "Company"("id", "symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyNumericals" ADD CONSTRAINT "CompanyNumericals_companyId_companySymbol_fkey" FOREIGN KEY ("companyId", "companySymbol") REFERENCES "Company"("id", "symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
