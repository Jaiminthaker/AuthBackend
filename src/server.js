require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { getJwtSecret } = require("./utils/generateToken");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  getJwtSecret();
  await connectDB();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start the server:", error);
  process.exitCode = 1;
});