const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }

  return secret;
}

function generateToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    algorithm: "HS256",
  });
}

module.exports = { generateToken, getJwtSecret };