const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const app = require("../src/app");
const User = require("../src/model/user.model");

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(() => {
  server.close();
});

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? headers : {
      "content-type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

test("health, auth validation, and login rate limiting", async () => {
  const root = await request("/");
  assert.equal(root.response.status, 200);
  assert.equal(root.body.status, "ok");
  assert.equal(root.body.endpoints.health, "GET /api/v1/health");

  const health = await request("/api/v1/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.body.status, "ok");
  assert.ok(health.body.timestamp);

  const invalidRegistration = await request("/api/v1/auth/register", {
    method: "POST",
    body: { email: "invalid", password: "short", phone: "+1 (555) 123-4567" },
  });
  assert.equal(invalidRegistration.response.status, 400);

  const existingUser = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      email: "person@example.com",
      password: "a-secure-password",
      phone: "9876543210",
    },
  });
  assert.equal(existingUser.response.status, 409);

  const invalidPhone = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      email: "person@example.com",
      password: "a-secure-password",
      phone: "not a phone number",
    },
  });
  assert.equal(invalidPhone.response.status, 400);
  assert.ok(User.schema.path("phone"));
  await assert.doesNotReject(() =>
    new User({ email: "legacy@example.com", password: "a-secure-password" })
      .validate(),
  );

  const unauthenticatedChange = await request(
    "/api/v1/auth/change-password",
    { method: "PATCH", body: {} },
  );
  assert.equal(unauthenticatedChange.response.status, 401);

  const emailSettings = [
    "FRONTEND_URL",
    "EMAIL_FROM",
    "EMAIL_TEST_MODE",
    "MAILTRAP_API_TOKEN",
    "MAILTRAP_FROM_EMAIL",
    "MAILTRAP_FROM_NAME",
    "MAILTRAP_CATEGORY",
  ];
  const originalSettings = new Map(
    emailSettings.map((setting) => [setting, process.env[setting]]),
  );
  const originalFindOne = User.findOne;
  const originalFetch = globalThis.fetch;
  emailSettings.forEach((setting) => delete process.env[setting]);
  try {
    User.findOne = async () => null;
    const unregisteredEmail = await request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "person@example.com" },
    });
    assert.equal(unregisteredEmail.response.status, 404);
    assert.equal(unregisteredEmail.body.message, "Sorry, you are not register.");

    process.env.EMAIL_FROM = "Auth API <no-reply@example.test>";
    process.env.FRONTEND_URL = "http://localhost:3000";
    process.env.EMAIL_TEST_MODE = "true";
    User.findOne = async () => ({
      email: "person@example.com",
      save: async () => {},
    });
    const forgotPassword = await request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "person@example.com" },
    });
    assert.equal(forgotPassword.response.status, 200);
    assert.equal(forgotPassword.body.status, "success");
    assert.match(forgotPassword.body.resetToken, /^[a-f0-9]{64}$/);

    process.env.EMAIL_TEST_MODE = "false";
    process.env.MAILTRAP_API_TOKEN = "test-mailtrap-token";
    process.env.MAILTRAP_FROM_EMAIL = "hello@example.test";
    process.env.MAILTRAP_FROM_NAME = "Auth API";
    process.env.MAILTRAP_CATEGORY = "Password Reset";
    User.findOne = async () => ({
      email: "person@example.com",
      save: async () => {},
    });
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith(baseUrl)) {
        return originalFetch(url, options);
      }

      assert.equal(url, "https://send.api.mailtrap.io/api/send");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer test-mailtrap-token");
      assert.equal(options.headers["Content-Type"], "application/json");
      const payload = JSON.parse(options.body);
      assert.deepEqual(payload.from, {
        email: "hello@example.test",
        name: "Auth API",
      });
      assert.deepEqual(payload.to, [{ email: "person@example.com" }]);
      assert.equal(payload.category, "Password Reset");
      assert.match(payload.text, /reset-password\/[a-f0-9]{64}/);
      return { ok: true, status: 200 };
    };

    const mailtrapForgotPassword = await request(
      "/api/v1/auth/forgot-password",
      { method: "POST", body: { email: "person@example.com" } },
    );
    assert.equal(mailtrapForgotPassword.response.status, 200);
    assert.equal(mailtrapForgotPassword.body.resetToken, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    User.findOne = originalFindOne;
    for (const [setting, value] of originalSettings) {
      if (value === undefined) {
        delete process.env[setting];
      } else {
        process.env[setting] = value;
      }
    }
  }

  const invalidResetToken = await request(
    "/api/v1/auth/reset-password/not-a-token",
    { method: "POST", body: { password: "a-secure-password" } },
  );
  assert.equal(invalidResetToken.response.status, 400);

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const login = await request("/api/v1/auth/login", {
      method: "POST",
      body: { email: "invalid", password: "a-secure-password" },
    });
    assert.equal(login.response.status, attempt <= 5 ? 400 : 429);
  }

  const missingRoute = await request("/not-found");
  assert.equal(missingRoute.response.status, 404);
});
