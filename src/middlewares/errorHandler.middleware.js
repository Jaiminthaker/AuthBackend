function errorHandler(error, req, res, next) {
  const statusCode =
    error.statusCode ||
    (error.name === "ValidationError" || error.type === "entity.parse.failed"
      ? 400
      : error.code === 11000
        ? 409
        : 500);
  const message =
    statusCode >= 500
      ? "Internal server error"
      : error.type === "entity.parse.failed"
        ? "Invalid JSON request body"
        : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  const response = {
    status: "error",
    message,
  };

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    response.errors = error.errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
