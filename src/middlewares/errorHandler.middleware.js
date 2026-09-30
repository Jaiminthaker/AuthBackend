function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const knownStatusCode = Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599;
  const statusCode = knownStatusCode
    ? error.statusCode
    : error.name === "ValidationError" || error.type === "entity.parse.failed"
      ? 400
      : error.code === 11000
        ? 409
        : 500;
  const message =
    statusCode >= 500
      ? "Internal server error"
      : error.type === "entity.parse.failed"
        ? "Invalid JSON request body"
        : error.message || "Request failed";

  if (statusCode >= 500) {
    console.error(error);
  }

  const response = {
    status: "error",
    message,
  };

  if (
    statusCode < 500 &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    response.errors = error.errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
