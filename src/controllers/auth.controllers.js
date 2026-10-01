const crypto = require("crypto");
const User = require("../model/user.model");
const ApiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken } = require("../utils/generateToken");
const {
  isEmailConfigured,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}

async function register(req, res) {
  const { name, email, password, phone } = req.body || {};

  if (await User.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
  });

  return apiResponse(res, 201, "User registered successfully", {
    user: publicUser(user),
    token: generateToken(user.id),
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email })
    .select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  return apiResponse(res, 200, "Login successful", {
    user: publicUser(user),
    token: generateToken(user.id),
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  const user = await User.findById(req.userId).select("+password");
  if (!user) {
    throw new ApiError(401, "The account for this token no longer exists");
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  if (await user.comparePassword(newPassword)) {
    throw new ApiError(400, "New password must differ from the current password");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return apiResponse(res, 200, "Password changed successfully");
}

async function forgotPassword(req, res) {
  const { email } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "Sorry, you are not register.");
  }

  if (!isEmailConfigured()) {
    throw new ApiError(503, "Password reset email is not configured");
  }

  const responseData = {};

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail(user.email, resetToken);

  if (process.env.EMAIL_TEST_MODE === "true") {
    responseData.resetToken = resetToken;
  }

  return apiResponse(
    res,
    200,
    "If an account exists for that email, a reset link will be sent",
    responseData,
  );
}

async function resetPassword(req, res) {
  const { password } = req.body || {};
  const { token } = req.params;
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");
  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return apiResponse(res, 200, "Password reset successfully");
}

module.exports = {
  register: asyncHandler(register),
  login: asyncHandler(login),
  changePassword: asyncHandler(changePassword),
  forgotPassword: asyncHandler(forgotPassword),
  resetPassword: asyncHandler(resetPassword),
};