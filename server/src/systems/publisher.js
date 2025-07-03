const process = require("process");
const { SUCCESS, FAILURE } = require("../utilities/constants");

class Publisher {
  /**
   * Creates a new Publisher instance for a specific company.
   * Initializes event storage for tracking stock price history.
   * @param {number} companyId - The unique identifier for the company
   * @param {string} companySymbol - The stock symbol for the company
   */
  constructor(companyId, companySymbol) {
    this.companyId = companyId;
    this.companySymbol = companySymbol;
    this.eventData = {};
  }

  /**
   * Fetches current stock price data from Finnhub API for this company.
   * Stores the result in the small event store with timestamp for tracking.
   * @returns {number} SUCCESS or FAILURE status code
   */
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
      this.eventData = {
        data: data,
        timestamp: Date.now(),
      };
      return SUCCESS;
    } catch (error) {
      return FAILURE;
    }
  }

  /**
   * Publishes the latest stock price data to Redis channel for subscribers.
   * Creates a message with company info and event data, then publishes to the specified stage.
   * @param {Object} publisherStage - Redis client instance for publishing messages
   * @param {string} stageName - The Redis channel name to publish to
   * @returns {number} 1 for success, 0 for failure
   */
  async publish(publisherStage, stageName) {
    try {
      const eventMessage = {
        companyId: this.companyId,
        companySymbol: this.companySymbol,
        ...this.eventData,
      };
      publisherStage.publish(stageName, JSON.stringify(eventMessage));
      return SUCCESS;
    } catch (error) {
      return FAILURE;
    }
  }
}

class QueueNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class PublisherQueue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Adds a new item to the end of the queue.
   * Creates a new node and updates the tail pointer accordingly.
   * @param {*} element - The element to add to the queue
   */
  enqueue(element) {
    const newNode = new QueueNode(element);
    if (this.head === null) {
      this.head = newNode;
    } else {
      this.tail.next = newNode;
    }
    this.tail = newNode;
    this.size++;
  }

  /**
   * Adds multiple elements to the queue in batch operation.
   * Iterates through the items array and enqueues each one individually.
   * @param {Array} elements - Array of elements to add to the queue
   */
  batchEnqueue(elements) {
    elements.forEach((item) => this.enqueue(item));
  }

  /**
   * Removes and returns the first item from the queue.
   * Updates head pointer and handles empty queue cases.
   * @returns {*} The dequeued item or null if queue is empty
   */
  dequeue() {
    if (this.head === null) {
      return null;
    }
    const node = this.head;
    this.head = this.head.next;
    if (this.head === null) {
      this.tail = null;
    }
    this.size--;
    return node.data;
  }

  /**
   * Gets all company IDs currently in the queue.
   * Traverses the linked list and collects unique company IDs.
   * @returns {Set} Set of company IDs in the queue
   */
  getQueueCompanyIds() {
    const companyIds = new Set();
    let current = this.head;
    while (current !== null) {
      if (current.data && current.data.companyId) {
        companyIds.add(current.data.companyId);
      }
      current = current.next;
    }
    return companyIds;
  }

  /**
   * Checks if a company with the given ID exists in the queue.
   * Traverses the linked list to find matching company ID.
   * @param {number} companyId - The company ID to check for
   * @returns {boolean} True if company exists in queue
   */
  hasCompany(companyId) {
    let current = this.head;
    while (current !== null) {
      if (current.data && current.data.companyId === companyId) {
        return true;
      }
      current = current.next;
    }
    return false;
  }

  /**
   * Removes all publishers for a specific company from the queue.
   * Traverses and rebuilds the linked list without the specified company.
   * @param {number} companyId - The company ID to remove from queue
   */
  removeCompanyFromQueue(companyId) {
    if (this.head === null) {
      return;
    }

    while (
      this.head !== null &&
      this.head.data &&
      this.head.data.companyId === companyId
    ) {
      this.head = this.head.next;
      this.size--;
      if (this.head === null) {
        this.tail = null;
      }
    }

    let current = this.head;
    while (current !== null && current.next !== null) {
      if (current.next.data && current.next.data.companyId === companyId) {
        if (current.next === this.tail) {
          this.tail = current;
        }
        current.next = current.next.next;
        this.size--;
      } else {
        current = current.next;
      }
    }
  }
}

module.exports = { Publisher, PublisherQueue };
