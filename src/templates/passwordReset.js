const { emailHtmlLayout, emailTextLayout } = require("./emailLayout");

function passwordResetTemplate(resetUrl) {
  const title = "Reset Your Password";

  return {
    subject: title,
    text: emailTextLayout(
      title,
      `Hello,

We received a request to reset your password.

Click the link below to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.
`,
    ),
    html: emailHtmlLayout(
      title,
      `
        <p>Hello,</p>

        <p>We received a request to reset your password.</p>

        <p>Click the button below to create a new password:</p>

        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>

        <p>This password reset link will expire in <strong>15 minutes</strong>.</p>

        <p>If you did not request a password reset, you can safely ignore this email.</p>
      `,
    ),
  };
}

module.exports = { passwordResetTemplate };