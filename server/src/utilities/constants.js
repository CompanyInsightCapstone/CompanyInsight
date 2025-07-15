const { priceAlertsLogger, trendingLogger } = require("./logger");

const LOGGER_TYPE = {
  PRICE_ALERTS: "price-alerts",
  TRENDING: "trending",
};

const WATCHLIST_TYPE = {
  SAVE: "SAVE",
  UNSAVE: "UNSAVE",
};

const WEBSOCKET_MESSAGE_TYPE = {
  REQUEST_TRENDING_COMPANIES: "request-trending-companies",
  TRENDING_COMPANIES: "trending-companies",
  PING: "ping",
  PONG: "pong",
};

const matchLogger = (service) => {
  if (service == LOGGER_TYPE.PRICE_ALERTS) {
    return priceAlertsLogger;
  }
  if (service == LOGGER_TYPE.TRENDING) {
    return trendingLogger;
  }
};

const SUCCESS = (operation, service = LOGGER_TYPE.PRICE_ALERTS) => {
  const logger = matchLogger(service);
  if (!logger) {
    return;
  }
  logger.info(`SUCCESS: ${operation}`);
  return 1;
};

const FAILURE = (
  operation,
  error = null,
  service = LOGGER_TYPE.PRICE_ALERTS,
) => {
  const logger = matchLogger(service);
  if (!logger) {
    return;
  }
  const errorMsg = error?.message || error || "Unknown error";
  logger.error(`FAILURE: ${operation} - ${errorMsg}`);
  return 0;
};

module.exports = {
  SUCCESS,
  FAILURE,
  LOGGER_TYPE,
  WATCHLIST_TYPE,
  WEBSOCKET_MESSAGE_TYPE,
};
