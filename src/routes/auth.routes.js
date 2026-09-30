const express = require("express");
const authController = require("../controllers/auth.controllers");
const { authenticate } = require("../middlewares/auth.middlewares");
const { loginRateLimiter } = require("../middlewares/rateLimiter.middlewares");

const router = express.Router();

router.post(
  "/register",
  /* #swagger.tags = ['Auth'] */
  /* #swagger.summary = 'Register a user' */
  /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'phone'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, phone: { type: 'string' } } } } } } */
  authController.register,
);
router.post(
  "/login",
  /* #swagger.tags = ['Auth'] */
  /* #swagger.summary = 'Log in' */
  /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } } } } } */
  loginRateLimiter,
  authController.login,
);
router.patch(
  "/change-password",
  /* #swagger.tags = ['Auth'] */
  /* #swagger.summary = 'Change the authenticated user password' */
  /* #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', minLength: 8 }, newPassword: { type: 'string', minLength: 8 } } } } } } */
  authenticate,
  authController.changePassword,
);
router.post(
  "/forgot-password",
  /* #swagger.tags = ['Auth'] */
  /* #swagger.summary = 'Request a password reset email' */
  /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } } } */
  authController.forgotPassword,
);
router.post(
  "/reset-password/:token",
  /* #swagger.tags = ['Auth'] */
  /* #swagger.summary = 'Reset a password using the emailed token' */
  /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 8 } } } } } } } */
  authController.resetPassword,
);

module.exports = router;