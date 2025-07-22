const database = require("../utilities/database");

class Company {
  constructor() {
    this.tableName = database.TABLE_NAMES_TYPE.COMPANIES;
  }

  async get(companyId) {
    return await database.scan(this.tableName, {
      where: { id: companyId },
    });
  }

  async maxPageId(pageSize) {
    return Math.ceil(
      (await database.tableCardinality(database.TABLE_NAMES_TYPE.COMPANIES)) /
        pageSize,
    );
  }

  async getPages(pageId, limit, blockSize) {
    const clauses = {
      include: {
        CompanyDetails: true,
        CompanyNumericals: true
      }
    };

    const blocks = await database.getPages(
      this.tableName,
      pageId,
      limit,
      blockSize,
      clauses,
    ) ;
    const pages = await database.paginate(blocks, [], limit, pageId);
    return pages;
  }


 async getFilteredPages(
  pageId,
  limit,
  blockSize,
  name,
  symbol,
  assetType,
  exchange,
  status,
  ipoDate,
) {

  const where = {};
  if (name && name.trim() !== "") {
    where.name = {
      contains: name.trim(),
      mode: "insensitive",
    };
  }
  if (symbol && symbol.trim() !== "") {
    where.symbol = {
      equals: symbol.trim(),
    };
  }
  if (exchange && exchange !== "all") {
    where.exchange = {
      contains: exchange,
      mode: "insensitive",
    };
  }
  if (assetType && assetType !== "all") {
    where.assetType = {
      contains: assetType,
      mode: "insensitive",
    };
  }
  if (status && status !== "all") {
    where.status = {
      contains: status,
      mode: "insensitive",
    };
  }

  let orderBy = { id: "asc" };
  if (ipoDate) {
    if (ipoDate === "earliest") {
      orderBy = {
        ipoDate: "asc",
      };
    } else if (ipoDate === "latest") {
      orderBy = {
        ipoDate: "desc",
      };
    }
  }

  const include = {
    CompanyDetails: true,
    CompanyNumericals: true
  };

  const clauses = {
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: orderBy,
    include: include
  };

  const blocks = await database.getPages(
    this.tableName,
    pageId,
    limit,
    blockSize,
    clauses,
  );


  const pages = await database.paginate(blocks, [], limit, pageId);
  return pages;
}

}

module.exports = { Company };
