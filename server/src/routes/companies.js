const express = require("express");
const database = require("../utilities/database");
const router = express.Router();

const BLOCK_SIZE = 4;
const PAGE_SIZE = 20;

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

module.exports = router;
