const express = require("express");
const database = require("../utilities/database");
const cache = require("../utilities/cache");
const router = express.Router();
const process = require("process");

/**
 * Saves a company to the user's saved companies list.
 * Checks for existing saves to prevent duplicates and creates new saved company record.
 * @route POST /api/user/companies/save
 */
router.post("/api/user/companies/save", async (req, res) => {
  try {
    const { companyId, companySymbol, percentChangeThreshold } = req.body;
    const userId = req.session.userId;
    if (!userId || !companyId || !companySymbol) {
      return res
        .status(400)
        .json({ error: "userId, companyId, and companySymbol are required" });
    }

    const existingSave = await database.scan(database.TABLE_NAMES_ENUM.SAVED, {
      where: {
        userId: userId,
        companyId: parseInt(companyId, 10),
      },
    });

    if (existingSave) {
      return res
        .status(409)
        .json({ error: "Company already saved by this user" });
    }

    let prevPrice;
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${this.companySymbol}`;
      const result = await fetch(url, {
        method: "GET",
        headers: {
          "X-Finnhub-Token": process.env.VITE_FINNHUB_API_KEY,
        },
      });
      const data = await result.json();
      prevPrice = data.c;
    } catch (_) {
      prevPrice = 0.0;
    }

    await database.createRecord(database.TABLE_NAMES_ENUM.SAVED, {
      userId: userId,
      companyId: parseInt(companyId, 10),
      companySymbol: companySymbol,
      percentChangeThreshold: percentChangeThreshold,
      previousPrice: prevPrice,
    });

    res.status(200).json({ message: "Saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Removes a company from the user's saved companies list.
 * Finds and deletes the saved company record for the specified user and company.
 * @route DELETE /api/user/companies/save
 */
router.delete("/api/user/companies/save", async (req, res) => {
  try {
    const companyId = req.query.companyId;
    const userId = req.session.userId;

    if (!userId || !companyId) {
      return res
        .status(400)
        .json({ error: "userId and companyId are required" });
    }

    const savedCompany = await database.scan(database.TABLE_NAMES_ENUM.SAVED, {
      where: {
        userId: userId,
        companyId: parseInt(companyId, 10),
      },
    });

    if (!savedCompany) {
      return res.status(404).json({ error: "Saved company not found" });
    }

    await database.deleteRecord(
      database.TABLE_NAMES_ENUM.SAVED,
      savedCompany.id,
    );
    res.status(200).json({ message: "Unsaved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retrieves all companies saved by the current user.
 * Returns saved companies with their associated company details.
 * @route GET /api/user/companies/save
 */
router.get("/api/user/companies/save", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const model = database.formatTableName(database.TABLE_NAMES_ENUM.SAVED);
    const savedCompanies = await model.findMany({
      where: { userId: userId },
      include: {
        company: true,
      },
    });

    res.status(200).json({ savedCompanies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/api/user/companies/save", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const { id } = req.query;
    const updatedDelta = parseFloat(req.body.priceDropThreshold);
    const newRecord = await database.updateRecord(
      database.TABLE_NAMES_ENUM.SAVED,
      parseInt(id, 10),
      { percentChangeThreshold: updatedDelta },
    );
    res.status(200).json({ newRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
