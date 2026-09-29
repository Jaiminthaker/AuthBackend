const crypto = require("crypto");
const User = require("../model/user.model");
const { generateToken } = require("../utils/generateToken");
const {
  isEmailConfigured,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validEmail(email) {
  return typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
}

function validPhone(phone) {
  if (typeof phone !== "string") {
    return false;
  }

  const normalizedPhone = phone.trim();
  const digits = normalizedPhone.replace(/\D/g, "");
  return /^\+?[0-9][0-9\s().-]*$/.test(normalizedPhone) &&
    digits.length === 10;
}

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
  if (!validEmail(email) || !validPassword(password) || !validPhone(phone)) {
    throw createError(
      400,
      "A valid email, phone number, and password of 8 to 72 bytes are required",
    );
  }
  if (name !== undefined && (typeof name !== "string" || name.trim().length > 100)) {
    throw createError(400, "Name must be a string of at most 100 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw createError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name: typeof name === "string" ? name.trim() : undefined,
    email: normalizedEmail,
    phone: phone.trim(),
    password,
  });

  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    user: publicUser(user),
    token: generateToken(user.id),
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!validEmail(email) || !validPassword(password)) {
    throw createError(400, "A valid email and password are required");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw createError(401, "Email or password is incorrect");
  }

  res.status(200).json({
    status: "success",
    message: "Login successful",
    user: publicUser(user),
    token: generateToken(user.id),
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (
    !validPassword(currentPassword) ||
    !validPassword(newPassword)
  ) {
    throw createError(
      400,
      "Current password and a new password of 8 to 72 bytes are required",
    );
  }

  const user = await User.findById(req.userId).select("+password");
  if (!user) {
    throw createError(401, "The account for this token no longer exists");
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw createError(401, "Current password is incorrect");
  }
  if (await user.comparePassword(newPassword)) {
    throw createError(400, "New password must differ from the current password");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
}

async function forgotPassword(req, res) {
  const { email } = req.body || {};
  if (!validEmail(email)) {
    throw createError(400, "A valid email is required");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    throw createError(404, "Sorry, you are not register.");
  }

  if (!isEmailConfigured()) {
    throw createError(503, "Password reset email is not configured");
  }

  const response = {
    status: "success",
    message: "If an account exists for that email, a reset link will be sent",
  };

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (error) {
    console.error("Password reset email delivery failed:", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw createError(502, "Unable to send password reset email");
  }

  if (process.env.SMTP_TEST_MODE === "true") {
    response.resetToken = resetToken;
  }

  return res.status(200).json(response);
}

async function resetPassword(req, res) {
  const { password } = req.body || {};
  const { token } = req.params;
  if (!validPassword(password)) {
    throw createError(400, "Password must be between 8 and 72 bytes");
  }
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw createError(400, "Invalid or expired password reset token");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");
  if (!user) {
    throw createError(400, "Invalid or expired password reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
  });
}

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};