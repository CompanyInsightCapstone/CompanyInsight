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
      const decodedMessage = JSON.parse(message);
      decodedMsgCallback(decodedMessage);
    });
  }
}

module.exports = Subscriber;
