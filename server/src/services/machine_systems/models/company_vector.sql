CREATE TABLE IF NOT EXISTS "CompanyEmbeddings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companySymbol" TEXT NOT NULL,
    "vector" vector(768),
    "lastUpdated" TIMESTAMP(3)
);

CREATE UNIQUE INDEX "CompanyEmbeddings_id_key" ON "CompanyEmbeddings"("id");

ALTER TABLE "CompanyEmbeddings" ADD CONSTRAINT "CompanyEmbeddings_companyId_companySymbol_fkey" FOREIGN KEY ("companyId", "companySymbol") REFERENCES "Company"("id", "symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS vector_idx ON "CompanyEmbeddings" USING hnsw (vector vector_cosine_ops);
