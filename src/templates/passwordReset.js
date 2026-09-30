function passwordResetTemplate(resetUrl) {
  return {
    subject: "Reset Your Password",

    text: `
Hello,

We received a request to reset your password.

Click the link below to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
Your App Team
    `.trim(),

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reset Your Password</title>
        </head>

        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">

          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; padding: 40px; border-radius: 8px;">

            <h1 style="margin-top: 0;">
              Reset Your Password
            </h1>

            <p>Hello,</p>

            <p>
              We received a request to reset your password.
            </p>

            <p>
              Click the button below to create a new password:
            </p>

            <p>
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 6px;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This password reset link will expire in
              <strong>15 minutes</strong>.
            </p>

            <p>
              If you did not request a password reset,
              you can safely ignore this email.
            </p>

            <hr />

            <p style="font-size: 12px; color: #777;">
              This is an automated email. Please do not reply to this message.
            </p>

          </div>

        </body>
      </html>
    `.trim(),
  };
}

module.exports = { passwordResetTemplate };