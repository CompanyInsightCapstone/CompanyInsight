const { PrismaClient, Prisma } = require("../generated/prisma");
const prisma = new PrismaClient();

const TABLE_NAMES_ENUM = {
  USER: "user",
  COMPANIES: "company",
};

function formatTableName(tableName) {
  return typeof tableName === "string"
    ? prisma[tableName.toLowerCase()]
    : prisma[tableName];
}

async function scan(tableName, clauses) {
  const model = formatTableName(tableName);
  return await model.findUnique(clauses);
}

async function create(tableName, creationData) {
  const model = formatTableName(tableName);
  return await model.create({ data: creationData });
}

async function getAll(tableName) {
  const model = formatTableName(tableName);
  return await model.findMany();
}

async function getPages(tableName, currentPageNumber, pageSize, blockSize) {
  const model = formatTableName(tableName);
  return await model.findMany({
    skip: (currentPageNumber*pageSize*blockSize),
    take: (pageSize*blockSize),
    orderBy: { id: 'asc' },
  });
}

async function tableCardinality(tableName) {
  const model = formatTableName(tableName);
  return await model.count();
}

module.exports = {
  scan,
  create,
  getAll,
  getPages,
  tableCardinality,
  TABLE_NAMES_ENUM,
};
