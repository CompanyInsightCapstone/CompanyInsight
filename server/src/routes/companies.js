const express = require("express");
const database = require("../utilities/database");
const router = express.Router();

router.get("/api/companies/", async (req, res) => {
  try {
    const companies = await database.getAll(
      database.TABLE_NAMES_ENUM.COMPANIES,
    );
    res.status(200).json({
      message: "Companies fetched successfully",
      companies: companies,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
