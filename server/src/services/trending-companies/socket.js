const ws = require("ws");
const WebSocketServer = ws.WebSocketServer;
const cache = require("../../utilities/cache");

class Websocket {
  constructor(port, getTrendingCompaniesCallback) {
    this.prevCompanies = null;
    this.getTrendingCompaniesCallback = getTrendingCompaniesCallback;
    this.server = new WebSocketServer({
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

    this.server.on("connection", async (client) => {
      if (this.prevCompanies) {
        client.send(this.prevCompanies);
      } else if (this.getTrendingCompaniesCallback) {
        try {
          const companies = await this.getTrendingCompaniesCallback();
          const message = {
            type: "trending-companies",
            data: companies,
            dirtyBit: true,
            timestamp: new Date().toISOString(),
          };
          const messageStr = JSON.stringify(message);
          this.prevCompanies = messageStr;
          client.send(messageStr);
        } catch (error) {
          const errorMessage = {
            type: "trending-companies",
            data: [],
            dirtyBit: false,
            message:
              "Error fetching trending companies data. Please try again later.",
            timestamp: new Date().toISOString(),
          };
          client.send(JSON.stringify(errorMessage));
        }
      }

      client.on("message", (message) => {
          const decodedMsg = JSON.parse(message.toString());
          this.handleClientMessage(decodedMsg, client);
      });
    });
  }

  handleClientMessage(message, client) {
    switch (message.type) {
      case "request-trending-companies":
        if (this.prevCompanies) {
          client.send(this.prevCompanies);
        } else {
          const cachedData = cache.get("prev-trending-companies");
          if (cachedData) {
            client.send(JSON.stringify(cachedData));
          } else {
            const noDataMessage = {
              type: "trending-companies",
              data: [],
              dirtyBit: false,
              message:
                "No data available",
              timestamp: new Date().toISOString(),
            };
            client.send(JSON.stringify(noDataMessage));
          }
        }
        break;

      case "ping":
        client.send(
          JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }),
        );
        break;

      default:
        break;
    }
  }

  send(data) {
    this.prevCompanies = data;
    this.server.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(data);
      }
    });
  }
}

module.exports = Websocket;
