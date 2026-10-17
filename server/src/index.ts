import Fastify from "fastify";
import { config } from "./config.js";
import { registerRoutes } from "./api/routes.js";
import { startBot } from "./bot/index.js";

const app = Fastify({ logger: true });

registerRoutes(app);

async function main() {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  console.log("🚀 API listening on :" + config.port);
  startBot();
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});

async function shutdown() {
  await app.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
