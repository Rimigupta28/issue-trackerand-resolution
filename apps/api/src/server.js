import { app } from "./app.js";
import { prisma } from "./db.js";

const port = Number(process.env.API_PORT || 4000);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be configured in the project root .env file.");
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be configured with at least 32 characters in the project root .env file.");
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`Issue Tracker API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down API.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
