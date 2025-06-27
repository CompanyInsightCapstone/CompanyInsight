const express = require("express");
const database = require("../utilities/database");
const cache = require("../utilities/rediscache");
const router = express.Router();
const BLOCK_SIZE = 4;
const PAGE_SIZE = 20;

const ALPHA_VANTAGE_URLS = {
  OVERVIEW: (symbol) =>
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.VITE_ALPHA_VANTAGE_API}`,
};
const POLYGON_URLS = {
  OVERVIEW: (symbol) =>
    `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${process.env.VITE_POLYGON_API}`,
};

router.get("/api/companies", async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const pages = new Array(BLOCK_SIZE);
    const companiesChunk = await database.getPages(
      database.TABLE_NAMES_ENUM.COMPANIES,
      page,
      PAGE_SIZE,
      BLOCK_SIZE,
    );
    for (let idx = 0; idx < BLOCK_SIZE; idx++) {
      const k = idx * PAGE_SIZE;
      pages[idx] = {
        pageNumber: page + idx,
        companiesData: companiesChunk.slice(k, k + PAGE_SIZE),
      };
    }
    res.status(200).json({
      currentPageNumber: page,
      pages,
      pageSize: PAGE_SIZE,
      blockSize: BLOCK_SIZE,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/companies/filter", async (req, res) => {
  try {
    const { page, name, ipoDate, exchange, assetType, status } = req.query;
    const pageId = parseInt(page) || 0;
    const pages = new Array(BLOCK_SIZE);
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

    const companiesChunk = await database.getPages(
      database.TABLE_NAMES_ENUM.COMPANIES,
      pageId,
      PAGE_SIZE,
      BLOCK_SIZE,
      clauses,
    );

    for (let idx = 0; idx < BLOCK_SIZE; idx++) {
      const k = idx * PAGE_SIZE;
      pages[idx] = {
        pageNumber: pageId + idx,
        companiesData: companiesChunk.slice(k, k + PAGE_SIZE),
      };
    }

    res.status(200).json({
      currentPageNumber: pageId,
      pages,
      pageSize: PAGE_SIZE,
      blockSize: BLOCK_SIZE,
      filters: { name, ipoDate, exchange, assetType, status },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { symbol } = req.query;
    const cacheKey = `(${id},${symbol})`;
    const cachedData = JSON.parse(await cache.get(cacheKey));
    if (cachedData) {
      res.status(200).json({ data: cachedData, cacheHit: true });
    } else {
      const url = POLYGON_URLS.OVERVIEW(symbol);
      const response = await fetch(url);
      const data = await response.json();
      await cache.set(cacheKey, JSON.stringify(data));
      res.status(200).json({ data, cacheHit: false });
    }
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
