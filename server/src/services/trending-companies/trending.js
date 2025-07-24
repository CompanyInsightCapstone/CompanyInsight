const Websocket = require("./lib/socket");
const cache = require("../../utilities/RedisClient");
const dotenv = require("dotenv");
const database = require("../../utilities/database");
dotenv.config();
const {
  SUCCESS,
  FAILURE,
  LOGGER_TYPE,
  WEBSOCKET_MESSAGE_TYPE,
} = require("../../utilities/constants");
const serviceParameters = require("./config.json");

const collectionEquality = (c1, c2) => {
  return JSON.stringify(c1) === JSON.stringify(c2);
};

class TrendingCompaniesService {
  constructor() {
    this.k = serviceParameters.k;
    this.refreshInterval = serviceParameters.refreshInterval;
    this.queueName = serviceParameters.queueName;
    this.topKName = serviceParameters.topKName;
    this.heavyHitters = [];
    this.callbacks = {
      onTrendingCompaniesRequest: () => {
        const eventMessage = {
          type: WEBSOCKET_MESSAGE_TYPE.TRENDING_COMPANIES,
          data: this.heavyHitters,
          timestamp: new Date().toISOString(),
        };
        return eventMessage;
      },
    };
    this.socket = new Websocket(this.callbacks);
  }

  async send() {
    try {
      const result = await cache.redisClient.zRangeWithScores(
        this.topKName,
        0,
        this.k - 1,
        { REV: true },
      );
      const candidates = result.map((item) => {
        const decodedJson = JSON.parse(item.value);
        const { companySymbol, companyId } = decodedJson;
        return { companySymbol, companyId, score: item.score };
      });

      if (collectionEquality(this.heavyHitters, candidates)) {
        return SUCCESS(
          "No changes in trending companies data, ending sending company",
          LOGGER_TYPE.TRENDING,
        );
      }
      this.heavyHitters = candidates;
      const eventMessage = {
        type: WEBSOCKET_MESSAGE_TYPE.TRENDING_COMPANIES,
        data: candidates,
        timestamp: new Date().toISOString(),
      };
      this.socket.sendMessage(eventMessage);
      return SUCCESS("Trending companies data sent", LOGGER_TYPE.TRENDING);
    } catch (error) {
      return FAILURE(
        "Failed to send trending companies data",
        error,
        LOGGER_TYPE.TRENDING,
      );
    }
  }

  async update() {
    try {
      const events = await cache.redisClient.lRange(this.queueName, 0, -1);
      if (!events || events.length === 0) {
        return SUCCESS("No events to process", LOGGER_TYPE.TRENDING);
      }

      events.forEach(async (event) => {
        try {
          const { companySymbol, companyId, eventType } = JSON.parse(event);
          const companyJsonKey = JSON.stringify({ companySymbol, companyId });
          switch (eventType) {
            case "SAVE":
              await cache.redisClient.zIncrBy(this.topKName, 1, companyJsonKey);
              SUCCESS(
                `Successfully incremented count for companyId=${companyId}, symbol=${companySymbol}`,
                LOGGER_TYPE.TRENDING,
              );
              break;
            case "UNSAVE":
              await cache.redisClient.zIncrBy(
                this.topKName,
                -1,
                companyJsonKey,
              );
              await cache.redisClient
                .zScore(this.topKName, companyJsonKey)
                .then((score) => {
                  if (score <= 0) {
                    cache.redisClient.zRem(this.topKName, companyJsonKey);
                  }
                });
              SUCCESS(
                `Successfully decremented count for companyId=${companyId}, symbol=${companySymbol}`,
                LOGGER_TYPE.TRENDING,
              );
              break;
            default:
              FAILURE(
                `Invalid event type: ${eventType}`,
                null,
                LOGGER_TYPE.TRENDING,
              );
              break;
          }
        } catch (error) {
          FAILURE(
            `Failed to process event: ${event}`,
            error,
            LOGGER_TYPE.TRENDING,
          );
        }
      });

      await cache.redisClient.lTrim(this.queueName, events.length, -1);
      SUCCESS(`Processed ${events.length} events`, LOGGER_TYPE.TRENDING);
    } catch (error) {
      return FAILURE(
        "Failed to update trending data",
        error,
        LOGGER_TYPE.TRENDING,
      );
    }
  }

  async initialize() {
    try {
      const sortedSetCount = await cache.redisClient.zCard(this.topKName);
      if (sortedSetCount > 0) {
        return SUCCESS("Trending data already initialized", LOGGER_TYPE.TRENDING);
      }
      const watchlistEntries = await database.executeQuery(
          "SELECT DISTINCT \"companyId\", \"companySymbol\" FROM \"Watchlist\""
      );
      const companyCounts = {};
      watchlistEntries.forEach(entry => {
          const key = JSON.stringify({
            companyId: entry.companyId,
            companySymbol: entry.companySymbol
          });
          companyCounts[key] = (companyCounts[key] || 0) + 1;
      });
      if (Object.keys(companyCounts).length > 0) {
        for (const [key, count] of Object.entries(companyCounts)) {
          await cache.redisClient.zAdd(this.topKName, {score: count, value: key});
        }
      }
    } catch (error) {
      return FAILURE("Failed to initialize trending data", error, LOGGER_TYPE.TRENDING);
    }
  }

  async run() {
    SUCCESS("Starting trending companies service", LOGGER_TYPE.TRENDING);
    await this.initialize();
    await this.update();
    await this.send();
    setInterval(() => this.update(), this.refreshInterval);
    setInterval(() => this.send(), this.refreshInterval);
  }
}

async function main() {
  const trendingCompaniesService = new TrendingCompaniesService();
  await trendingCompaniesService.run();
}

main();
