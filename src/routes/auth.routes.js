const express = require("express");
const authController = require("../controllers/auth.controllers");
const { authenticate } = require("../middlewares/auth.middlewares");
const { loginRateLimiter } = require("../middlewares/rateLimiter.middlewares");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.patch(
  "/change-password",
  authenticate,
  authController.changePassword,
);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;