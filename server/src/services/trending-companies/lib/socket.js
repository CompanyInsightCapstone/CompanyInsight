const ws = require("ws");
const {
  WEBSOCKET_MESSAGE_TYPE,
  SUCCESS,
  LOGGER_TYPE,
} = require("../../../utilities/constants");
const process = require("process");
class Websocket {
  constructor(port, callbacks) {
    this.callbacks = callbacks;
    console.log("WebSocket host:", process.env.WEBSOCKET_HOST || "0.0.0.0");
    this.server = new ws.WebSocketServer({
      host: process.env.WEBSOCKET_HOST || "0.0.0.0",
      port: port,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3,
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024,
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024,
      },
    });
  }

  sendMessage(data) {
    const message = JSON.stringify(data);
    this.server.clients.forEach((client) => {
      if (client.readyState) {
        client.send(message);
      }
    });
  }

  receiveMessages() {
    this.server.on("connection", (client) => {
      client.on("message", (data) => {
        const message = JSON.parse(data);
        switch (message.type) {
          case WEBSOCKET_MESSAGE_TYPE.REQUEST_TRENDING_COMPANIES:
            client.send(
              JSON.stringify(this.callbacks.onTrendingCompaniesRequest()),
            );
            break;
          case WEBSOCKET_MESSAGE_TYPE.PING:
            client.send(JSON.stringify({ type: WEBSOCKET_MESSAGE_TYPE.PONG }));
            break;
        }
        SUCCESS(`Message received from client: ${data}`, LOGGER_TYPE.TRENDING);
      });
    });
  }
}

module.exports = Websocket;
