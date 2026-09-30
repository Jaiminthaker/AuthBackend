function apiResponse(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({
    ...data,
    status: "success",
    message,
  });
}

module.exports = apiResponse;
