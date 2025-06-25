const express = require("express");
const database = require("../utilities/database");
const router = express.Router();

const BLOCK_SIZE = 4
const PAGE_SIZE = 20

router.get("/api/companies", async (req, res) => {
  try {
    const page = parseInt(req.query.page)
    const pages = []
    for (let currentPageId = page; currentPageId < page + BLOCK_SIZE; currentPageId++) {
        const companiesData = await database.getPage(database.TABLE_NAMES_ENUM.COMPANIES, PAGE_SIZE)
        pages.push({pageNumber: currentPageId, companiesData})
    }

    res.status(200).json({
        currentPageNumber: page,
        pages,
        pageSize: PAGE_SIZE,
        blockSize: BLOCK_SIZE
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
