const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const TABLE_NAMES_ENUM = {
  USER: "user",
  COMPANIES: "company",
};

/**
 * Format the table name to the prisma model name
 * @param {*} tableName - name of the table
 */
function formatTableName(tableName) {
  return typeof tableName === "string"
    ? prisma[tableName.toLowerCase()]
    : prisma[tableName];
}

/**
 * Scan the table named tableName for a specific record statisfying the clauses
 * @param {*} tableName - name of the table
 * @param {*} clauses - sql clauses to filter the records
 * @returns
 */
async function scan(tableName, clauses) {
  const model = formatTableName(tableName);
  return await model.findUnique(clauses);
}

/**
 * Create a new record in the table named tableName with the creationData
 * @param {*} tableName - name of the table
 * @param {*} creationData - data to create the record with
 */
async function create(tableName, creationData) {
  const model = formatTableName(tableName);
  return await model.create({ data: creationData });
}

/**
 * Get all records in the table named tableName
 * @param {*} tableName - name of the table
 */
async function getAll(tableName) {
  const model = formatTableName(tableName);
  return await model.findMany();
}

/**
 * Get a page of records in the table named tableName
 * @param {*} tableName - name of the table
 * @param {*} currentPageNumber - 0 based
 * @param {*} pageSize - number of records per page
 * @param {*} blockSize - number of pages to fetch at a time
 * @returns
 */
async function getPages(tableName, currentPageNumber, pageSize, blockSize) {
  const model = formatTableName(tableName);
  return await model.findMany({
    skip: currentPageNumber * pageSize * blockSize,
    take: pageSize * blockSize,
    orderBy: { id: "asc" },
  });
}

/**
 * Get the number of records in the table named tableName
 * @param {*} tableName - name of the table
 */
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
