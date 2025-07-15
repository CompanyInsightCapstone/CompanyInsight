const database = require("../utilities/database");

class Auth {
  constructor() {
    this.userTable = database.TABLE_NAMES_TYPE.USER;
    this.userSettingsTable = database.TABLE_NAMES_TYPE.USER_SETTINGS;
  }

  async checkSession(userId) {
    return await database.scan(this.userTable, {
      where: { id: userId },
      select: { username: true, email: true, password: false },
    });
  }

  async checkExistingUser(username) {
    return await database.scan(this.userTable, {
      where: { username: username },
    });
  }

  async checkExistingEmail(email) {
    return await database.scan(this.userTable, {
      where: { email: email },
    });
  }

  async createNewUser(username, email, hashedPassword) {
    return await database.createRecord(this.userTable, {
      username,
      email,
      password: hashedPassword,
    });
  }

  async createNewUserSettings(userId) {
    return await database.createRecord(this.userSettingsTable, {
      userId: userId,
    });
  }

  async getUserSettings(userId) {
    return await database.scan(this.userSettingsTable, {
      where: { userId: userId },
    });
  }
}

module.exports = { Auth };
