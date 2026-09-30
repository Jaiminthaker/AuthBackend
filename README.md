# Authentication API

Backend for the authentication API, built with Node.js and Express.

## Setup

Copy `.env.example` to `.env`, then set `MONGODB_URI`, a long random
`JWT_SECRET`, and the Mailtrap settings used to send password reset links. The
frontend reset page should be available at
`FRONTEND_URL/reset-password/:token`.

Generate a suitable JWT secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```sh
npm install
npm run dev
```

Swagger UI is available at `http://localhost:5000/api-docs`. The OpenAPI
document is generated from the Express routes before the server starts. To
regenerate it manually after changing routes or Swagger annotations, run:

```sh
npm run swagger:generate
```

The server listens on port `5000` by default. It connects to MongoDB before
accepting requests.

Run the API validation and rate-limiter tests with `npm test`. Account creation,
login, and password updates require a reachable MongoDB instance; reset emails
require a valid Mailtrap Email API token.

To send password-reset emails through Mailtrap, provide `MAILTRAP_API_TOKEN`, set
`MAILTRAP_FROM_EMAIL` to an address on your verified Mailtrap sending domain, and
set `MAILTRAP_FROM_NAME` to the sender name. `MAILTRAP_CATEGORY` is optional and
defaults to `Password Reset`. Keep the API token in `.env`; do not commit it. The
Mailtrap Email API requires a verified sending domain for live delivery.

Set `EMAIL_TEST_MODE=true` to build password-reset emails with Nodemailer's JSON
transport instead of sending through Mailtrap. This is useful for local testing;
it requires `EMAIL_FROM` or `MAILTRAP_FROM_EMAIL` and `FRONTEND_URL`, but does not
send email. In this mode, the forgot-password response includes `resetToken` for
testing in tools such as Postman. Never enable this mode in production.

Check delivery status in [Mailtrap Email Logs](https://mailtrap.io/sending/email_logs).

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/health` | API health check |
| POST | `/api/v1/auth/register` | Create an account (`email`, `password`, optional `name`) |
| POST | `/api/v1/auth/login` | Sign in; limited to 5 attempts per 15 minutes per IP |
| PATCH | `/api/v1/auth/change-password` | Change password with a bearer JWT and `currentPassword` / `newPassword` |
| POST | `/api/v1/auth/forgot-password` | Email a single-use reset link (`email`) |
| POST | `/api/v1/auth/reset-password/:token` | Set a new password (`password`) using the emailed token |

Passwords must be 8-72 bytes. Registration and login return a bearer JWT; send
it as `Authorization: Bearer <token>` to change the password. Reset tokens are
single-use and expire after 15 minutes. Forgot-password responses do not reveal
whether an email address has an account.

Health check returns the API status and time:

```json
{
  "status": "ok",
  "message": "API is healthy",
  "timestamp": "2026-09-29T10:00:00.000Z"
}
```