const { priceAlertsLogger, trendingLogger } = require("./logger");

const SUCCESS = (operation, service = "price-alerts") => {
  const logger = service === "trending" ? trendingLogger : priceAlertsLogger;
  logger.info(`SUCCESS: ${operation}`);
  return 1;
};

const FAILURE = (operation, error = null, service = "price-alerts") => {
  const logger = service === "trending" ? trendingLogger : priceAlertsLogger;
  const errorMsg = error?.message || error || "Unknown error";
  logger.error(`FAILURE: ${operation} - ${errorMsg}`);
  return 0;
};

const SYSTEM_THRESHOLD = 5;

module.exports = { SUCCESS, FAILURE, SYSTEM_THRESHOLD };
