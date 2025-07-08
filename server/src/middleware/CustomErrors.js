class APIError extends Error {
  constructor(message, status, name) {
    super(message);
    this.status = status;
    this.name = name;
  }
}

const AuthErrorType = Symbol("AuthError");
const CompaniesErrorType = Symbol("CompaniesError");
const UserErrorType = Symbol("UserError");

class AuthError extends APIError {
  constructor(message, status) {
    super(message, status, "AuthError");
    this[AuthErrorType] = true;
  }
}

class CompaniesError extends APIError {
  constructor(message, status) {
    super(message, status, "CompaniesError");
    this[CompaniesErrorType] = true;
  }
}

class UserError extends APIError {
  constructor(message, status) {
    super(message, status, "UserError");
    this[UserErrorType] = true;
  }
}

module.exports = {
  AuthError,
  CompaniesError,
  UserError,
};
