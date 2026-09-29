const nodemailer = require("nodemailer");

function isEmailConfigured() {
  const provider = process.env.EMAIL_PROVIDER || "smtp";
  const testMode = process.env.SMTP_TEST_MODE === "true";

  if (!process.env.FRONTEND_URL) {
    return false;
  }
  if (testMode) {
    return Boolean(process.env.SMTP_FROM);
  }
  if (provider === "mailtrap") {
    return Boolean(
      process.env.MAILTRAP_API_TOKEN &&
        process.env.MAILTRAP_FROM_EMAIL &&
        process.env.MAILTRAP_FROM_NAME,
    );
  }
  if (provider !== "smtp") {
    return false;
  }

  return Boolean(
    process.env.SMTP_FROM &&
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

async function sendPasswordResetEmail(email, resetToken) {
  if (!isEmailConfigured()) {
    throw new Error("Email provider configuration is incomplete");
  }

  const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, "");
  const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;
  const message = {
    subject: "Reset your password",
    text: `Use this link to reset your password. It expires in 15 minutes: ${resetUrl}`,
    html: `<p>Use the link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  };

  if (process.env.SMTP_TEST_MODE === "true") {
    const transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter.sendMail({ from: process.env.SMTP_FROM, to: email, ...message });
  }

  if (process.env.EMAIL_PROVIDER === "mailtrap") {
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

  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({ from: process.env.SMTP_FROM, to: email, ...message });
}

module.exports = { isEmailConfigured, sendPasswordResetEmail };