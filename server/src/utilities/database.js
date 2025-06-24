const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();


const TABLE_NAMES_ENUM = {
    USER: "user",
}

async function scan(tableName, clauses) {
    return await prisma[tableName].findUnique(clauses)
}

async function create(tableName, creationData) {
    return await prisma[tableName].create({data: creationData})
}


module.exports = {
    scan,
    create,
    TABLE_NAMES_ENUM
};
