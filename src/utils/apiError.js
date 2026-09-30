class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.status = "error";
    this.isOperational = true;

    if (errors.length > 0) {
      this.errors = errors;
    }

    Error.captureStackTrace?.(this, ApiError);
  }
}

module.exports = ApiError;
