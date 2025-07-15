const redis = require("redis");
const dotenv = require("dotenv");
const {
  SUCCESS,
  FAILURE,
  WATCHLIST_TYPE,
  LOGGER_TYPE,
} = require("./constants");
dotenv.config();

const redisClient = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

redisClient.connect();

async function set(key, value) {
  return redisClient.set(key, JSON.stringify(value));
}

async function get(key) {
  const value = await redisClient.get(key);
  return JSON.parse(value);
}

async function has(key) {
  return redisClient.exists(key);
}

async function del(key) {
  return redisClient.del(key);
}

async function eventEnqueue(queueName, data) {
  const eventType = data.eventType;
  try {
    redisClient.rPush(queueName, JSON.stringify(data));
    if (
      eventType === WATCHLIST_TYPE.SAVE ||
      eventType == WATCHLIST_TYPE.UNSAVE
    ) {
      SUCCESS(`Event ${eventType} enqueued`, LOGGER_TYPE.TRENDING);
    }
  } catch (error) {
    FAILURE(`Event ${eventType} failed to enqueue`, error, LOGGER_TYPE.TRENDING);
  }
}

module.exports = {
  set,
  get,
  del,
  has,
  eventEnqueue,
  redisClient,
  redisModule: redis,
};
