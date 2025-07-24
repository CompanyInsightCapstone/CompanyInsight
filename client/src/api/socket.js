import { CONNECTION_STATUS_ENUM, WEBSOCKET_MESSAGE_TYPE } from "../constants";
const SOCKET_ADDRRESS = import.meta.env.VITE_WEBSOCKET_SERVER_ADDRESS;

export class TrendingCompaniesWebsocket {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.connectionStatus = CONNECTION_STATUS_ENUM.DISCONNECTED;
    this.socket = new WebSocket(SOCKET_ADDRRESS);
    this.socket.onopen = () => {
      this.connectionStatus = CONNECTION_STATUS_ENUM.CONNECTED;
      this.callbacks.onStatusChange(this.connectionStatus);
      this.socket.send(JSON.stringify({ type: WEBSOCKET_MESSAGE_TYPE.PING }));
      this.socket.send(
        JSON.stringify({
          type: WEBSOCKET_MESSAGE_TYPE.REQUEST_TRENDING_COMPANIES,
        }),
      );
    };

    this.socket.onclose = () => {
      this.connectionStatus = CONNECTION_STATUS_ENUM.DISCONNECTED;
      this.callbacks.onStatusChange(this.connectionStatus);
    };

    this.socket.onerror = (error) => {
      this.connectionStatus = CONNECTION_STATUS_ENUM.ERROR;
      this.callbacks.onStatusChange(this.connectionStatus);
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case WEBSOCKET_MESSAGE_TYPE.REQUEST_TRENDING_COMPANIES:
        case WEBSOCKET_MESSAGE_TYPE.TRENDING_COMPANIES:
          this.callbacks.onTrendingCompanies(message.data);
          break;
        default:
      }
      if (message.type === WEBSOCKET_MESSAGE_TYPE.PING) {
        this.socket.send(JSON.stringify({ type: WEBSOCKET_MESSAGE_TYPE.PONG }));
      }
    };
  }
}
