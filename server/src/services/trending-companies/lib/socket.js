const ws = require("ws");
const {
  WEBSOCKET_MESSAGE_TYPE,
  SUCCESS,
  LOGGER_TYPE,
} = require("../../../utilities/constants");
const process = require("process");
const http = require("http");
const express = require("express");

class Websocket {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.port = process.env.VITE_TRENDING_COMPANIES_WEBSOCKET_PORT || 8081;
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.server = new ws.WebSocketServer({
      noServer: true,
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
      verifyClient: () => {
        return true;
      },
    });

    this.httpServer.on('upgrade', (request, socket, head) => {
      this.server.handleUpgrade(request, socket, head, (ws) => {
        this.server.emit('connection', ws, request);
      });
    });

    this.httpServer.listen(this.port, process.env.WEBSOCKET_HOST || "0.0.0.0", () => {
      console.log(`WebSocket server is running on port ${this.port}`);
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
