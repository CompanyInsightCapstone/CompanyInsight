const database = require("../utilities/database");

class User {
  constructor() {
    this.userTable = database.TABLE_NAMES_TYPE.USER;
    this.userSettingsTable = database.TABLE_NAMES_TYPE.USER_SETTINGS;
    this.watchlistTable = database.TABLE_NAMES_TYPE.SAVED;
  }

  async updateUserSettings(settingsId, data) {
    return await database.updateRecord(
      this.userSettingsTable,
      settingsId,
      data,
    );
  }

  async getSavedCompany(userId, companyId) {
    return await database.scan(database.TABLE_NAMES_TYPE.SAVED, {
      where: {
        userId: userId,
        companyId: companyId,
      },
    });
  }

  async saveCompany(
    userId,
    companyId,
    companySymbol,
    percentChangeThreshold,
    prevPrice,
  ) {
    return await database.createRecord(this.watchlistTable, {
      userId: userId,
      companyId: companyId,
      companySymbol: companySymbol,
      percentChangeThreshold: percentChangeThreshold,
      previousPrice: prevPrice,
    });
  }

  async updateSavedCompany(id, data) {
    return await database.updateRecord(this.watchlistTable, id, data);
  }

  async getSavedCompanies(userId) {
    return await database.formatTableName(this.watchlistTable).findMany({
      where: { userId: userId },
      include: {
        company: true,
      },
    });
  }

  async unsaveCompany(savedCompanyId) {
    return await database.deleteRecord(this.watchlistTable, savedCompanyId);
  }
}

module.exports = { User };
