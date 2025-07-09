import { CONNECTION_STATUS_ENUM, WEBSOCKET_MESSAGE_TYPE } from "../constants";

class TrendingSocket {
  constructor() {
    this.ws = null;
    this.callbacks = {};
  }

  connect(callbacks) {
    this.callbacks = callbacks;
    this.ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_SERVER_ADDRESS);

    this.ws.onopen = () => {
      this.callbacks.onStatusChange?.(CONNECTION_STATUS_ENUM.CONNECTED);
      this.send({ type: WEBSOCKET_MESSAGE_TYPE.REQUEST_TRENDING_COMPANIES });
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === WEBSOCKET_MESSAGE_TYPE) {
        this.callbacks.onDataReceived?.(data);
      }
    };

    this.ws.onerror = () => {
      this.callbacks.onStatusChange?.(CONNECTION_STATUS_ENUM.ERROR);
    };

    this.ws.onclose = () => {
      this.callbacks.onStatusChange?.(CONNECTION_STATUS_ENUM.DISCONNECTED);
      setTimeout(() => this.connect(this.callbacks), 5000);
    };
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  requestTrendingData() {
    this.send({ type: WEBSOCKET_MESSAGE_TYPE.REQUEST_TRENDING_COMPANIES });
  }

  disconnect() {
    this.ws?.close();
  }
}

export const trendingSocket = new TrendingSocket();
