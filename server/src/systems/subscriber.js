const nodemailer = require("nodemailer");
const database = require("../../utilities/database");
const cache =require("../../utilities/cache.js");
const process = require("process");



const SYSTEM_THRESHOLD = 5;

function percentChange(prev, curr, threshold) {
  return Math.abs((curr - prev) * (Math.abs(prev)**-1) * 100) > threshold;
}

class Subscriber {
  constructor(subscriberStage) {
    this.subscriberStage = subscriberStage;
  }

  subscribe(stageName) {
    this.subscriberStage.subscribe(stageName, async function (message) {
      const decodedMessage = JSON.parse(message);
      const sqlQuery = `
                SELECT DISTINCT u.email FROM "User" u
                JOIN "UserSavedCompany" usc ON u.id = usc."userId"
                WHERE usc."companyId" = '${decodedMessage.companyId}'
            `;

      const mailingList = await database.executeQuery(sqlQuery);
      mailingList.forEach((email) => {
        if (!percentChange(0, decodedMessage.eventData.data.c, SYSTEM_THRESHOLD)) {
          return;
        }

      });
    });
  }
}

module.exports = Subscriber;
