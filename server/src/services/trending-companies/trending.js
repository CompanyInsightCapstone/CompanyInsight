const database = require("../../utilities/database");
const Websocket = require("../../services/trending-companies/socket");
const cache = require("../../utilities/cache");
const { SUCCESS, FAILURE } = require("../../utilities/constants");
const process = require("process");

const THIRTY_SECONDS = 30000;
class TrendingCompaniesService {
  constructor() {
    this.k = 5;
    this.timeInterval = THIRTY_SECONDS;
    this.ws = new Websocket(
      process.env.VITE_TRENDING_COMPANIES_WEBSOCKET_PORT,
      () => this.getTrendingCompanies(this.k),
    );
  }

  async getTrendingCompanies(k) {
    const sqlQuery = `
            SELECT w."companyId", w."companySymbol", COUNT(*) AS "companyCount"
            FROM "Watchlist" w
            GROUP BY w."companyId", w."companySymbol"
            ORDER BY "companyCount" DESC
            LIMIT $1
        `;
    const companies = await database.executeQuery(sqlQuery, [k]);

    return companies.map((company) => ({
      ...company,
      companyCount: Number(company.companyCount),
    }));
  }

  async sendTrendingCompanies(companies) {
    try {
      const message = {
        type: "trending-companies",
        data: companies,
        dirtyBit: true,
        timestamp: new Date().toISOString(),
      };

      try {
        await cache.set("prev-trending-companies", message, 60);
      } catch (cacheError) {
        FAILURE(
          "Failed to cache trending companies data",
          cacheError,
          "trending",
        );
      }

      this.ws.send(JSON.stringify(message));
      return SUCCESS("Trending companies data sent", "trending");
    } catch (error) {
      return FAILURE(
        "Failed to send trending companies data",
        error,
        "trending",
      );
    }
  }

  async run() {
    try {
      setInterval(async () => {
        const companies = await this.getTrendingCompanies(this.k);
        await this.sendTrendingCompanies(companies);
      }, this.timeInterval);
      const companies = await this.getTrendingCompanies(this.k);
      await this.sendTrendingCompanies(companies);
      return SUCCESS("Trending companies service started", "trending");
    } catch (error) {
      return FAILURE(
        "Failed to start trending companies service",
        error,
        "trending",
      );
    }
  }
}

const main = async () => {
  const trendingCompaniesService = new TrendingCompaniesService();
  try {
    await trendingCompaniesService.run();
  } catch (error) {
    FAILURE("Failed to start trending companies service", error, "trending");
  }
};

main();
