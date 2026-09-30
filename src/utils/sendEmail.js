const nodemailer = require("nodemailer");
const { passwordResetTemplate } = require("../templates/passwordReset");

function isEmailConfigured() {
  const testMode = process.env.EMAIL_TEST_MODE === "true";

  if (!process.env.FRONTEND_URL) {
    return false;
  }

  if (testMode) {
    return Boolean(process.env.EMAIL_FROM || process.env.MAILTRAP_FROM_EMAIL);
  }

  return Boolean(
    process.env.MAILTRAP_API_TOKEN &&
      process.env.MAILTRAP_FROM_EMAIL &&
      process.env.MAILTRAP_FROM_NAME,
  );
}

async function sendPasswordResetEmail(email, resetToken) {
  if (!isEmailConfigured()) {
    throw new Error("Email provider configuration is incomplete");
  }

  const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, "");
  
  const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;
  
  // get email template from the template
  const message = passwordResetTemplate(resetUrl);

  // Test mode
  if (process.env.EMAIL_TEST_MODE === "true") {
    const transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.MAILTRAP_FROM_EMAIL,
      to: email,
      ...message,
    });
  }

  const response = await fetch("https://send.api.mailtrap.io/api/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MAILTRAP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: {
        email: process.env.MAILTRAP_FROM_EMAIL,
        name: process.env.MAILTRAP_FROM_NAME,
      },
      to: [{ email }],
      ...message,
      category: process.env.MAILTRAP_CATEGORY || "Password Reset",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mailtrap API returned ${response.status}: ${detail}`);
  }

  return { status: response.status };
}

module.exports = { isEmailConfigured, sendPasswordResetEmail };