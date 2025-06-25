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

async function getPage(tableName, pageSize) {
  const model = formatTableName(tableName);
  return await model.findMany({
    skip: pageSize,
    take: pageSize,
    orderBy: { id: 'asc' }, 
  });
}
async function tableCardinality(tableName) {
  const model = formatTableName(tableName);
  return await model.count();
}

async function executeQuery(query) {
  return await prisma.$queryRaw`${query}`;
}

async function executeRawQuery(query) {
  return await prisma.$executeRaw`${query}`;
}

module.exports = {
  scan,
  create,
  getAll,
  getPage,
  tableCardinality,
  executeQuery,
  executeRawQuery,
  TABLE_NAMES_ENUM,
};
