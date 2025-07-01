const express = require("express");
const database = require("../utilities/database");
const cache = require("../utilities/rediscache");
const router = express.Router();

router.post("/api/user/companies/save", async (req, res) => {
    try {
      const { userId, companyId, companySymbol } = req.body;
      if (!userId || !companyId || !companySymbol) {
        return res.status(400).json({ error: "userId, companyId, and companySymbol are required" });
      }
      const existingSave = await database.scan(database.TABLE_NAMES_ENUM.SAVED, {
        where: {
          userId: userId,
          companyId: parseInt(companyId, 10)
        }
      });
      if (existingSave) {
        return res.status(409).json({ error: "Company already saved by this user" });
      }
      await database.createRecord(database.TABLE_NAMES_ENUM.SAVED, {
        userId,
        companyId: parseInt(companyId, 10),
        companySymbol
      });
      res.status(200).json({ message: "Saved" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })

  router.delete("/api/user/companies/save", async (req, res) => {
    try {
      const { userId, companyId } = req.query;

      if (!userId || !companyId) {
        return res.status(400).json({ error: "userId and companyId are required" });
      }

      const savedCompany = await database.scan(database.TABLE_NAMES_ENUM.SAVED, {
        where: {
          userId: userId,
          companyId: parseInt(companyId, 10)
        }
      });

      if (!savedCompany) {
        return res.status(404).json({ error: "Saved company not found" });
      }

      await database.deleteRecord(database.TABLE_NAMES_ENUM.SAVED, savedCompany.id);
      res.status(200).json({ message: "Unsaved" });
    } catch (error) {
      console.error("Error unsaving company:", error);
      res.status(500).json({ error: error.message });
    }
  })

  router.get("/api/user/companies/save", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const model = database.formatTableName(database.TABLE_NAMES_ENUM.SAVED);
      const savedCompanies = await model.findMany({
        where: { userId: userId },
        include: {
          company: true
        }
      });

      res.status(200).json({ savedCompanies });
    } catch (error) {
      console.error("Error fetching saved companies:", error);
      res.status(500).json({ error: error.message });
    }
  })

module.exports = router;
