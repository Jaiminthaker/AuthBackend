const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../utils/generateToken");

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function authenticate(req, res, next) {
  const authorization = req.get("authorization");
  const parts = authorization ? authorization.split(" ") : [];
  const [scheme, token] = parts;

  if (scheme !== "Bearer" || !token || parts.length !== 2) {
    return next(createError(401, "A bearer token is required"));
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return next(createError(401, "Invalid authentication token"));
    }

    req.userId = payload.sub;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError(401, "Invalid or expired authentication token"));
    }
    return next(error);
  }
}

module.exports = { authenticate };