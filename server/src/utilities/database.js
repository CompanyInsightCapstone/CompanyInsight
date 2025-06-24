const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const TABLE_NAMES_ENUM = {
    USER: "user",
}

async function scan(tableName, clauses) {
    const model = typeof tableName === 'string' ?
        prisma[tableName.toLowerCase()] :
        prisma[tableName];
    return await model.findUnique(clauses);
}

async function create(tableName, creationData) {
    const model = typeof tableName === 'string' ?
        prisma[tableName.toLowerCase()] :
        prisma[tableName];
    return await model.create({data: creationData});
}

module.exports = {
    scan,
    create,
    TABLE_NAMES_ENUM
};
