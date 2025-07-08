const express = require("express");
const database = require("../utilities/database");
const cache = require("../utilities/cache");
const router = express.Router();
const { CompaniesError } = require("../middleware/CustomErrors");

const BLOCK_SIZE = 4;
const PAGE_SIZE = 20;

const MAX_PAGE = (async () => {
  const n = await database.tableCardinality(
    database.TABLE_NAMES_ENUM.COMPANIES,
  );
  return Math.ceil(n / PAGE_SIZE);
})();

const ALPHA_VANTAGE_URLS = {
  OVERVIEW: (symbol) =>
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.VITE_ALPHA_VANTAGE_API_KEY}`,
};

const POLYGON_URLS = {
  OVERVIEW: (symbol) =>
    `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${process.env.VITE_POLYGON_API_KEY}`,

  TIMESERIES: (symbol, multiplier, from, to, limit) =>
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${from}/${to}/limit=${limit}&apiKey=${process.env.VITE_POLYGON_API_KEY}`,
};

/**
 * Retrieves paginated list of companies with block-based pagination.
 * Returns companies in pages with configurable page size and block size.
 * @route GET /api/companies
 */
router.get("/api/companies", async (req, res, next) => {
  try {
    const pageId = parseInt(req.query.page, 10);
    if (isNaN(pageId) || pageId < 0) {
      return next(new CompaniesError("Invalid page number", 400));
    }

    if (pageId > MAX_PAGE) {
      return res.status(202).json({
        currentPageNumber: 0,
        pages: [],
        pageSize: PAGE_SIZE,
        blockSize: BLOCK_SIZE,
      });
    }

    const pages = database.paginate(
      await database.getPages(
        database.TABLE_NAMES_ENUM.COMPANIES,
        pageId,
        PAGE_SIZE,
        BLOCK_SIZE,
      ),
      [],
      PAGE_SIZE,
      pageId,
    );

    let statusCode = 200;
    if (pages.length === 0 && pageId !== 0) {
      statusCode = 201;
    }

    if (pages.length === 0) {
      statusCode = 202;
    }

    res.status(statusCode).json({
      currentPageNumber: pageId,
      pages: pages,
      pageSize: PAGE_SIZE,
      blockSize: BLOCK_SIZE,
    });
  } catch (error) {
    next(new CompaniesError("Error retrieving companies", 500));
  }
});

/**
 * Filters companies based on search criteria with pagination support.
 * Supports filtering by name, exchange, asset type, status, and IPO date sorting.
 * @route GET /api/companies/filter
 */
router.get("/api/companies/filter", async (req, res, next) => {
  try {
    const { page, name, ipoDate, exchange, assetType, status } = req.query;
    const where = {};
    if (name && name.trim() !== "") {
      where.name = {
        contains: name.trim(),
        mode: "insensitive",
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

    const clauses = {
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: orderBy,
    };

    const pageId = parseInt(page, 10) || 0;
    if (pageId < 0) {
      return next(new CompaniesError("Invalid page number", 400));
    }

    const companiesChunk = await database.getPages(
      database.TABLE_NAMES_ENUM.COMPANIES,
      pageId,
      PAGE_SIZE,
      BLOCK_SIZE,
      clauses,
    );
    const pages = database.paginate(companiesChunk, [], PAGE_SIZE, pageId);
    let statusCode = 200;
    if (pages.length === 0 && pageId !== 0) {
      statusCode = 201;
    }
    if (pages.length === 0) {
      statusCode = 202;
    }
    res.status(statusCode).json({
      currentPageNumber: pageId,
      pages: pages,
      pageSize: PAGE_SIZE,
      blockSize: BLOCK_SIZE,
    });
  } catch (error) {
    next(new CompaniesError("Error filtering companies", 500));
  }
});

/**
 * Retrieves detailed company information by ID with caching support.
 * Fetches company overview data from Polygon API and caches results for performance.
 * @route GET /api/companies/:id
 */
router.get("/api/companies/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { symbol } = req.query;

    if (!id || !symbol) {
      return next(
        new CompaniesError("Company ID and symbol are required", 400),
      );
    }

    const cacheKey = `(${id},${symbol})`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      res.status(200).json({ data: cachedData, cacheHit: true });
    } else {
      const url = POLYGON_URLS.OVERVIEW(symbol);
      const response = await fetch(url);

      if (!response.ok) {
        return next(
          new CompaniesError(
            `Failed to fetch company data: ${response.statusText}`,
            response.status,
          ),
        );
      }

      const data = await response.json();
      await cache.set(cacheKey, data);
      res.status(200).json({ data, cacheHit: false });
    }
  } catch (error) {
    next(new CompaniesError("Error retrieving company details", 500));
  }
});

/**
 * Retrieves time series data for a company with caching support.
 * Fetches historical stock price data from Polygon API with configurable parameters.
 * @route GET /api/companies/timeseries
 */
router.get("/api/companies/timeseries", async (req, res, next) => {
  try {
    const { companyId, companySymbol, from, to, multiplier, limit } = req.query;

    if (!companyId || !companySymbol || !from || !to) {
      return next(
        new CompaniesError(
          "Company ID, symbol, from date, and to date are required",
          400,
        ),
      );
    }

    const cacheKey = `(${companyId},${companySymbol},${from},${to},${multiplier},${limit})`;
    if (cache.has(cacheKey)) {
      res.status(200).json({ data: cache.get(cacheKey), cacheHit: true });
    } else {
      const url = POLYGON_URLS.TIMESERIES(
        companySymbol,
        multiplier,
        from,
        to,
        limit,
      );
      const response = await fetch(url);

      if (!response.ok) {
        return next(
          new CompaniesError(
            `Failed to fetch time series data: ${response.statusText}`,
            response.status,
          ),
        );
      }

      const data = await response.json();
      cache.set(cacheKey, data);
      res.status(200).json({ data, cacheHit: false });
    }
  } catch (error) {
    next(new CompaniesError("Error retrieving time series data", 500));
  }
});

module.exports = router;
