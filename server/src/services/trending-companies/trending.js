const database = require("../../utilities/database");
const cache = require("../../utilities/cache");

const Websocket = require("./socket");
const { SUCCESS, FAILURE } = require("../../utilities/constants");

class TrendingCompaniesService {
  constructor() {
    this.k = 5;
    this.timeInterval = 30000;
    this.ws = new Websocket(8081, () => this.getTrendingCompanies(this.k));
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
    cache.set("prev-trending-companies", companies);
    return companies;
  }

  async sendTrendingCompanies(companies) {
    const message = {
      type: "trending-companies",
      data: companies,
      dirtyBit: true,
      timestamp: new Date().toISOString(),
    };
    this.ws.send(JSON.stringify(message));
  }

  async run() {
    try {
      setInterval(async () => {
        const companies = await this.getTrendingCompanies(this.k);
        await this.sendTrendingCompanies(companies);
      }, this.timeInterval);
      const companies = await this.getTrendingCompanies(this.k);
      await this.sendTrendingCompanies(companies);
      return SUCCESS;
    } catch (error) {
      return FAILURE;
    }
  }
}

const main = async () => {
  const trendingCompaniesService = new TrendingCompaniesService();
  await trendingCompaniesService.run();
};

main();
