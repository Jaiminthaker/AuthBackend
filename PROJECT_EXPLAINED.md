# Auth Backend Project Explained Simply

This project is a small Node.js + Express backend for user authentication. It lets users:

- register an account
- log in
- change their password
- request a password reset
- reset a forgotten password
- check if the API is healthy

It uses MongoDB with Mongoose, JWT for authentication, and email sending for password reset messages.

---

## 1. What this project does

This backend is responsible for managing user accounts and protecting routes with login tokens.

A typical flow is:

1. User signs up with name, email, phone, and password.
2. The server checks the data and creates a user in MongoDB.
3. The user logs in.
4. The server returns a JWT token.
5. That token is used to access protected routes like change password.
6. If the user forgets the password, the server sends a reset link by email.
7. The user resets the password using the reset token.

---

## 2. Project structure

- `src/app.js` – creates the Express app and connects all routes
- `src/server.js` – starts the server
- `src/routes/auth.routes.js` – defines all auth API endpoints
- `src/routes/health.routes.js` – health check endpoint
- `src/controllers/auth.controllers.js` – all main business logic
- `src/model/user.model.js` – MongoDB user schema
- `src/middlewares/auth.middlewares.js` – checks JWT tokens
- `src/middlewares/rateLimiter.middlewares.js` – limits login attempts
- `src/utils/generateToken.js` – creates JWT tokens
- `src/utils/sendEmail.js` – sends reset emails
- `src/config/db.js` – database connection setup

---

## 3. Main functions in the project

### A. Register user
Route: `POST /api/v1/auth/register`

What it does:

- receives `name`, `email`, `password`, and `phone`
- validates the email, phone, and password
- checks if the email is already registered
- creates a new user in MongoDB
- returns a success message and a JWT token

Important rules:

- email must be valid
- password must be at least 8 characters and within size limits
- phone number must be valid
- duplicate email is rejected

### B. Login user
Route: `POST /api/v1/auth/login`

What it does:

- checks email and password format
- finds the user in the database
- compares the typed password with the saved hashed password
- if correct, returns the user info and a JWT token

This is protected by a login rate limiter to stop brute-force attacks.

### C. Change password
Route: `PATCH /api/v1/auth/change-password`

What it does:

- requires a valid JWT token
- gets the logged-in user from the token
- checks current password
- makes sure the new password is different from the old one
- saves the new password

This route is protected by the `authenticate` middleware.

### D. Forgot password
Route: `POST /api/v1/auth/forgot-password`

What it does:

- takes the user email
- finds the user in the database
- creates a secure reset token
- stores a hashed token and expiry time
- sends a password reset email

If the email is not found, the API returns a clear error message.

### E. Reset password
Route: `POST /api/v1/auth/reset-password/:token`

What it does:

- reads the reset token from the URL
- checks that the token is valid and not expired
- finds the user who owns that token
- updates the password
- clears the reset token and expiry date

This is the final step after a user clicks the reset link.

### F. Health check
Route: `GET /api/v1/health`

What it does:

- tells whether the API is running
- returns a `status: "ok"` response with a timestamp

### G. Root route
Route: `GET /`

What it does:

- returns basic server status
- lists the available API endpoints

### H. JWT authentication middleware
File: `src/middlewares/auth.middlewares.js`

What it does:

- reads the `Authorization` header
- expects a `Bearer <token>` format
- verifies the JWT token
- loads the logged-in user ID into the request
- allows the request to continue only if valid

### I. Rate limiter
File: `src/middlewares/rateLimiter.middlewares.js`

What it does:

- limits repeated login attempts
- prevents attackers from trying many passwords quickly

### J. Email sending helper
File: `src/utils/sendEmail.js`

What it does:

- checks whether email settings are configured
- sends the password reset email through Mailtrap
- supports test mode for local development

This helps the project work safely in testing without sending real emails accidentally.

---

## 4. Database model

The `User` model stores:

- `name`
- `email`
- `phone`
- `password`
- `resetPasswordToken`
- `resetPasswordExpires`
- timestamps (`createdAt` and `updatedAt`)

The password is always hashed before saving using `bcryptjs`.

---

## 5. JWT token system

The project uses JWT tokens to keep users logged in.

- `generateToken.js` creates a JWT with the user ID inside it
- the token expires after a configured time (default is 1 hour)
- the `authenticate` middleware checks the token before protected routes run

This means the user does not need to log in again for every request.

---

## 6. How the API is organized

The app is split into simple parts:

- routes: where URL endpoints are defined
- controllers: where actions take place
- middleware: extra checks before business logic runs
- model: database structure
- utils: reusable helper functions like JWT and email sending

This keeps the project easier to maintain and understand.

---

## 7. Example flow

### Register
```
POST /api/v1/auth/register
{
  "name": "John",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "MyPassword123"
}
```

### Login
```
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "MyPassword123"
}
```

### Forgot password
```
POST /api/v1/auth/forgot-password
{
  "email": "john@example.com"
}
```

### Reset password
```
POST /api/v1/auth/reset-password/<token>
{
  "password": "NewPassword456"
}
```

---

## 8. In one sentence

This project is a basic authentication backend that lets users register, log in, secure protected routes, and safely reset forgotten passwords with email confirmation.

---

## 9. Good things about this project

- simple and easy to follow
- clean separation of routes, logic, and database model
- password hashing for security
- JWT authentication for protected routes
- reset-email flow improves usability
- rate limiting helps prevent login abuse

---

If you want, I can also turn this into a more professional README version with setup instructions and API examples.
