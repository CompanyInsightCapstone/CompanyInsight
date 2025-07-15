const { SUCCESS, FAILURE, LOGGER_TYPE } = require("../../utilities/constants");

class Subscriber {
  constructor(subscriberStage) {
    this.subscriberStage = subscriberStage;
  }

  /**
   * Subscribes to a Redis channel and processes incoming messages.
   * Parses JSON messages and executes callback function with decoded data.
   * @param {string} stageName - The Redis channel name to subscribe to
   * @param {Function} decodedMsgCallback - Callback function to handle decoded messages
   */
  subscribe(stageName, decodedMsgCallback) {
    this.subscriberStage.subscribe(stageName, async (message) => {
      try {
        const decodedMessage = JSON.parse(message);
        await decodedMsgCallback(decodedMessage);
        return SUCCESS(
          "Subscriber successfully processed incoming message",
          LOGGER_TYPE.PRICE_ALERTS,
        );
      } catch (error) {
        return FAILURE(
          "Subscriber failed to process incoming message",
          error,
          LOGGER_TYPE.PRICE_ALERTS,
        );
      }
    });
  }
}

module.exports = Subscriber;
