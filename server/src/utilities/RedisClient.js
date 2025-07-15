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

module.exports = {
  set,
  get,
  del,
  has,
  redisClient,
  redisModule: redis,
};
