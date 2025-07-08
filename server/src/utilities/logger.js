const winston = require("winston");
const path = require("path");

const fs = require("fs");
const logsDir = path.join(__dirname, "../services/logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
  }),
);

const priceAlertsLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "price-alerts.log"),
      level: "info",
    }),
  ],
  silent: false,
});

const trendingLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "trending-companies.log"),
      level: "info",
    }),
  ],
  silent: false,
});

module.exports = {
  priceAlertsLogger,
  trendingLogger,
};
