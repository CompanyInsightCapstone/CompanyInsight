const database = require("../../utilities/database");
const cache = require("../../utilities/RedisClient");
const { Publisher, PublisherQueue } = require("./publisher");
const Subscriber = require("./subscriber");
const Emailer = require("./lib/emailer");
const { SUCCESS, FAILURE, LOGGER_TYPE } = require("../../utilities/constants");
const serviceParameters = require("./config.json");

const formatEmailSubject = (symbol, percentage) => `Company Insights: ${symbol} has changed by ${percentage}%`;

const formatEmailBody = (symbol, percentage, prev, curr) =>
  `
  We wanted to bring to your attention that the stock price of ${symbol} has changed by ${percentage}%, going from ${prev} to ${curr}.
  Please note that this is an automated notification and not a personalized investment advice.
  We encourage you to consult with a financial advisor or conduct your own research before making any decisions.
  Best regards,
  Company Insights
`;

/**
 * Handles email notifications when stock price drops exceed the system threshold.
 * Calculates percentage change and sends emails to users who have saved the company.
 * @param {Object} emailer - The emailer service instance for sending notifications
 * @param {Object} decodedMessage - Decoded message containing company and stock data
 * @returns {number} SUCCESS or FAILURE status code
 */
async function percentDropMailerCallback(emailer, decodedMessage) {
  try {
    if (
      !decodedMessage.data ||
      decodedMessage.data.c === undefined ||
      decodedMessage.data.c === null
    ) {
      return FAILURE(
        "Email notification failed",
        new Error("Missing or invalid stock price data"),
      );
    }

    const mailingQuery = `
      SELECT DISTINCT u.email, u.id as "userId", usc."percentChangeThreshold", usc."previousPrice" FROM "User" u
      JOIN "Watchlist" usc ON u.id = usc."userId"
      WHERE usc."companyId" = $1
    `;

    const mailingParams = [ decodedMessage.companyId]
    const userMailingList = await database.executeQuery(mailingQuery,mailingParams);
    let emailsSent = 0;
    let emailsNotSent = 0;

    userMailingList.forEach(async (user) => {
      if (!user.previousPrice) {
        emailsNotSent++;
        return;
      }

      const delta = 100 * (decodedMessage.data.c / user.previousPrice - 1);
      const deltaPercent = Math.abs(delta);
      if (delta > 0 || deltaPercent < user.percentChangeThreshold) {
        emailsNotSent++;
        return;
      }
      emailer.sendEmail(
        user.email,
        formatEmailSubject(decodedMessage.companySymbol, deltaPercent),
        formatEmailBody(
          decodedMessage.companySymbol,
          deltaPercent,
          user.previousPrice,
          decodedMessage.data.c,
        ),
      );
      emailsSent++;

      const updateQuery =  `UPDATE "Watchlist" SET "previousPrice" = $1 WHERE "companyId" = $2 AND "userId" = '$3'`
      const updateParams = [decodedMessage.data.c, decodedMessage.companyId, user.userId];
      await database.executeQuery(updateQuery, updateParams)
    });
    return SUCCESS(
      `Email notification stage successful, number of emails sent this round: ${emailsSent}, emails not sent (price change not within user set threshold or stock not supported by FinnHub API): ${emailsNotSent}`,
      LOGGER_TYPE.PRICE_ALERTS,
    );
  } catch (error) {
    return FAILURE(
      "Email notification failed",
      error,
      LOGGER_TYPE.PRICE_ALERTS,
    );
  }
}

class StockPriceNotificationService {
  constructor(stageName) {
    this.stageName = stageName;
    this.publisherStage = cache.redisModule.createClient();
    this.subscriberStage = cache.redisModule.createClient();
    this.timeInterval = serviceParameters.timeInterval;
    this.refreshQueueInterval = serviceParameters.refreshQueueInterval;
    this.iteration = 0;
    this.emailer = new Emailer();
  }

  /**
   * Initializes the notification service by connecting to Redis and setting up publishers.
   * Fetches all saved companies from database and creates publisher instances for each.
   */
  async initialization() {
    await this.publisherStage.connect();
    await this.subscriberStage.connect();
    const records = await database.executeQuery(
      `SELECT DISTINCT "companyId", "companySymbol" FROM "Watchlist"`,
    );
    this.publishers = new PublisherQueue();
    this.publishers.batchEnqueue(
      records.map((r) => new Publisher(r.companyId, r.companySymbol)),
    );
    this.subscriber = new Subscriber(this.subscriberStage);
  }

  /**
   * Starts the polling cycle that continuously fetches stock prices and publishes updates.
   * Dequeues publishers, polls their stock data, publishes to Redis, then re-enqueues them.
   */
  async queueRounds() {
    setInterval(async () => {
      const currentStageSpeaker = this.publishers.dequeue();
      if (!currentStageSpeaker) {
        return;
      }
      await currentStageSpeaker.poll();
      await currentStageSpeaker.publish(
        this.publisherStage,
        this.stageName,
      );
      this.publishers.enqueue(currentStageSpeaker);
    }, this.timeInterval);
  }

  /**
   * Incrementally updates the queue by adding new companies and removing deleted ones.
   * More efficient than rebuilding the entire queue - only changes what's necessary.
   */
  async refreshQueue() {
    try {
      const currentCompanies = await database.executeQuery(
        `SELECT DISTINCT "companyId", "companySymbol" FROM "Watchlist"`,
      );

      const queueCompanyIds = this.publishers.getQueueCompanyIds();
      const currentCompanyIds = new Set(
        currentCompanies.map((c) => c.companyId),
      );
      const toAdd = currentCompanies.filter(
        (c) => !queueCompanyIds.has(c.companyId),
      );
      const toRemove = [...queueCompanyIds].filter(
        (id) => !currentCompanyIds.has(id),
      );
      if (toAdd.length > 0) {
        toAdd.forEach((company) => {
          this.publishers.enqueue(
            new Publisher(company.companyId, company.companySymbol),
          );
        });
      }
      if (toRemove.length > 0) {
        toRemove.forEach((companyId) => {
          this.publishers.removeCompanyFromQueue(companyId);
        });
      }
      return SUCCESS("Queue refreshed", LOGGER_TYPE.PRICE_ALERTS);
    } catch (error) {
      return FAILURE("Queue refresh failed", error, LOGGER_TYPE.PRICE_ALERTS);
    }
  }

  /**
   * Starts the complete notification service including initialization and polling.
   * Sets up subscriber callback and begins continuous stock price monitoring.
   */
  async run() {
    await this.initialization();
    this.subscriber.subscribe(this.stageName, (decodedMsg) =>
      percentDropMailerCallback(this.emailer, decodedMsg),
    );
    this.queueRounds();
    setInterval(() => this.refreshQueue(), this.refreshQueueInterval);
  }
}

const main = () => {
  const stageName = "StockPriceNotifications";
  const service = new StockPriceNotificationService(stageName);
  service.run();
};

main();
