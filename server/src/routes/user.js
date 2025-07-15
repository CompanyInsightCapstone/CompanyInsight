const express = require("express");
const router = express.Router();
const { UserError } = require("../middleware/CustomErrors");
const { WATCHLIST_TYPE, LOGGER_TYPE } = require("../utilities/constants");
const QueueService = require("../utilities/QueueService");
const process = require("process");
const queueName = "WATCHLIST";

const { User } = require("../models/User");
const userModel = new User();

const savesQueueService = new QueueService(
  queueName,
  WATCHLIST_TYPE.SAVE,
  LOGGER_TYPE.TRENDING,
);

const unsavesQueueService = new QueueService(
  queueName,
  WATCHLIST_TYPE.UNSAVE,
  LOGGER_TYPE.TRENDING,
);

/**
 * Saves a company to the user's saved companies list.
 * Checks for existing saves to prevent duplicates and creates new saved company record.
 * @route POST /api/user/companies/save
 */
router.post("/api/user/companies/save", async (req, res, next) => {
  try {
    const { companyId, companySymbol, percentChangeThreshold } = req.body;
    const userId = req.session.userId;
    if (!userId || !companyId || !companySymbol) {
      return next(
        new UserError("userId, companyId, and companySymbol are required", 400),
      );
    }

    const existingCompany = await userModel.getSavedCompany(userId, companyId);

    if (existingCompany) {
      return next(new UserError("Company already saved by this user", 409));
    }

    let prevPrice;
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${companySymbol}`;
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

    const savedCompany = await userModel.saveCompany(
      userId,
      companyId,
      companySymbol,
      percentChangeThreshold,
      prevPrice,
    );

    const eventData = {
      companyId: savedCompany.companyId,
      companySymbol: savedCompany.companySymbol,
      watchlistId: savedCompany.id,
    };

    savesQueueService.eventEnqueue(eventData);

    res.status(200).json({ message: "Saved" });
  } catch (error) {
    next(new UserError("Error saving company", 500));
  }
});

/**
 * Removes a company from the user's saved companies list.
 * Finds and deletes the saved company record for the specified user and company.
 * @route DELETE /api/user/companies/save
 */
router.delete("/api/user/companies/save", async (req, res, next) => {
  try {
    const companyId = req.query.companyId;
    const userId = req.session.userId;

    if (!userId || !companyId) {
      return next(new UserError("userId and companyId are required", 400));
    }

    const savedCompany = await userModel.getSavedCompany(userId, companyId);

    if (!savedCompany) {
      return next(new UserError("Saved company not found", 404));
    }

    await userModel.unsaveCompany(savedCompany.id);

    const eventData = {
      companyId: savedCompany.companyId,
      companySymbol: savedCompany.companySymbol,
      watchlistId: savedCompany.id,
    };

    unsavesQueueService.eventEnqueue(eventData);

    res.status(200).json({ message: "Unsaved" });
  } catch (error) {
    next(new UserError("Error removing saved company", 500));
  }
});

/**
 * Retrieves all companies saved by the current user.
 * Returns saved companies with their associated company details.
 * @route GET /api/user/companies/save
 */
router.get("/api/user/companies/save", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return next(new UserError("userId is required", 400));
    }

    const savedCompanies = await userModel.getSavedCompanies(userId);

    res.status(200).json({ savedCompanies });
  } catch (error) {
    next(new UserError("Error retrieving saved companies", 500));
  }
});

/**
 * Updates the price drop threshold for a saved company.
 * Modifies the percentage change threshold that triggers email notifications.
 * @route PATCH /api/user/companies/save
 */
router.patch("/api/user/companies/save", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return next(new UserError("userId is required", 400));
    }
    const { id } = req.query;
    const updatedDelta = parseFloat(req.body.priceDropThreshold);

    if (!id) {
      return next(new UserError("Record ID is required", 400));
    }

    if (isNaN(updatedDelta) || updatedDelta < 0 || updatedDelta > 100) {
      return next(
        new UserError(
          "Price drop threshold must be a number between 0 and 100",
          400,
        ),
      );
    }

    const newRecord = userModel.updateSavedCompany(id, {
      percentChangeThreshold: updatedDelta,
    });
    res.status(200).json({ newRecord });
  } catch (error) {
    next(new UserError("Error updating price drop threshold", 500));
  }
});

/**
 * Update user settings
 * @route PATCH /api/user/settings
 */
router.patch("/api/user/settings", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const settingsId = req.query.settingsId;
    if (!userId) {
      return next(new UserError("userId is required", 400));
    }

    const { infiniteScroll } = req.body;

    const newRecord = await userModel.updateUserSettings(settingsId, {
      infiniteScroll: infiniteScroll,
    });

    res.status(200).json({ message: "Settings updated" });
  } catch (error) {
    console.error("Error updating user settings:", error);
    next(new UserError("Error updating settings", 500));
  }
});

module.exports = router;
