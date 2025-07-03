const cache = require("../../utilities/cache");
const database = require("../../utilities/database");
const process = require("process");

class Publisher {
  constructor(companyId, companySymbol) {
    this.companyId = companyId;
    this.companySymbol = companySymbol;
    this.smallEventStore = [{}, {}, {}];
    this.smallEventIdx = 0;
  }

  async poll() {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${this.companySymbol}`;
      const result = await fetch(url, {
        method: "GET",
        headers: {
          "X-Finnhub-Token": process.env.VITE_FINNHUB_API_KEY,
        },
      });
      const data = await result.json();
      this.smallEventStore[this.smallEventIdx % 3] = {
        data,
        timestamp: Date.now(),
      };
      return 1
    } catch (error) {
      return 0

    }
  }

  async publish(publisherStage, stageName) {
    try {
        const eventMessage = {
            companyId: this.companyId,
            companySymbol: this.companySymbol,
            message: "TESTMSG",
            eventData: this.smallEventStore[this.smallEventIdx % 3],
        };
        this.smallEventIdx++;
        publisherStage.publish(stageName, JSON.stringify(eventMessage));
        return 1
    } catch (error) {
        return 0
    }
  }
}

class PublisherQueue {
  constructor(arr) {
    this.ringBuffer = arr;
    this.ringBufferSize = arr.length;
    this.ringBufferIdx = 0;
  }

  enqueue(publisher) {
    this.ringBuffer.push(publisher);
    this.ringBufferSize++;
  }

  dequeue() {
    return this.ringBuffer.at(this.ringBufferIdx++ % this.ringBufferSize);
  }
}

module.exports = { Publisher, PublisherQueue };
