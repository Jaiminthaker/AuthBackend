const express = require("express");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Auth API is running",
    endpoints: {
      docs: "GET /api-docs",
      health: "GET /api/v1/health",
      register: "POST /api/v1/auth/register",
      login: "POST /api/v1/auth/login",
      changePassword: "PATCH /api/v1/auth/change-password",
      forgotPassword: "POST /api/v1/auth/forgot-password",
      resetPassword: "POST /api/v1/auth/reset-password/:token",
    },
  });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app;