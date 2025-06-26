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

module.exports = router;
