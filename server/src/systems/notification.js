const cache = require("../../utilities/cache");
const {
  Publisher,
  PublisherQueue,
} = require("../../systems/publisher");
const Subscriber = require("../../systems/subscriber");
const database = require("../../utilities/database");

class StockPriceNotificationService {
  constructor(stageName) {
    this.stageName = stageName;
    this.publisherStage = cache.redisModule.createClient();
    this.subscriberStage = cache.redisModule.createClient();
    this.timeInterval = (30000 << 1)
    this.iteration = 0;
  }

  async initialization() {
    await this.publisherStage.connect();
    await this.subscriberStage.connect();
    const records = await database.executeQuery(
      `SELECT DISTINCT "companyId", "companySymbol" FROM "UserSavedCompany"`,
    );
    this.publishers = new PublisherQueue(
      records.map((r) => new Publisher(r.companyId, r.companySymbol)),
    );
    this.subscriber = new Subscriber(this.subscriberStage);
  }

  async queueRounds() {
    setInterval(async () => {
      const currentStageSpeaker = this.publishers.dequeue();
      const pollResult = (await currentStageSpeaker.poll())
      await currentStageSpeaker.publish(this.publisherStage, this.stageName);
      if (pollResult) {
        this.publishers.enqueue(currentStageSpeaker);
      }
    }, this.timeInterval);
  }

  async run() {
    await this.initialization();
    this.subscriber.subscribe(this.stageName);
    this.queueRounds();
  }
}

function main() {
  const service = new StockPriceNotificationService("StockPriceNotifications");
  service.run();
}

main();
