export const CONNECTION_STATUS_ENUM = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
  DISCONNECTED: "disconnected",
};

export const WEBSOCKET_MESSAGE_TYPE = {
  REQUEST_TRENDING_COMPANIES: "request-trending-companies",
  TRENDING_COMPANIES: "trending-companies",
  PING: "ping",
  PONG: "pong",
};

export const FETCH_STATUS_TYPE = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  NO_RESULTS: "no_results",
  NO_MORE_RESULTS: "no_more_results",
  ERROR: "error",
};


export const FILTER_FIELDS = {
  NAME: "name",
  SYMBOL: "symbol",
  IPO_DATE: "ipoDate",
  EXCHANGE: "exchange",
  ASSET_TYPE: "assetType",
  STATUS: "status",
};

/**
 * Generates configuration object for candlestick chart plotting
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @param {number} top - Top margin
 * @param {number} right - Right margin
 * @param {number} bottom - Bottom margin
 * @param {number} left - Left margin
 * @returns {Object} Configuration object for chart plotting
 */
export function generatePartialConfigPlot(
  width,
  height,
  top,
  right,
  bottom,
  left,
) {
  return {
    width,
    height,
    margin: { top, right, bottom, left },
  };
}
