import "dotenv/config";
import { createApp } from "./app.js";
import { initSentry } from "./lib/sentry.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

initSentry();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

const server = app.listen(port, () => {
  logger.info(`GuildWork API listening on port ${port}`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
