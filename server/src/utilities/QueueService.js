const { SUCCESS, FAILURE} = require("./constants");
const { redisClient } = require("./RedisClient");

class QueueService {
    constructor(queueName, eventType, loggerType) {
        this.queueName = queueName;
        this.eventType = eventType;
        this.loggerType = loggerType
    }

    async eventEnqueue(data) {
      try {
          redisClient.rPush(this.queueName, JSON.stringify({...data, eventType: this.eventType}));
          SUCCESS(`Event ${this.eventType} enqueued`, this.loggerType);
        } catch (error) {
          FAILURE(`Event ${this.eventType} failed to enqueue`, error, this.loggerType);
        }
      }
}

module.exports = QueueService;
