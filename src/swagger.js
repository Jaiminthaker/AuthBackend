const swaggerAutogen = require("swagger-autogen")({
  openapi: "3.0.0",
});

const outputFile = "./swagger.json";
const endpointsFiles = ["./app.js"];
const document = {
  info: {
    title: "Authentication API",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  tags: [{ name: "Health" }, { name: "Auth" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, document).catch((error) => {
  console.error("Failed to generate Swagger documentation:", error);
  process.exitCode = 1;
});
