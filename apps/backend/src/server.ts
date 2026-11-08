import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: env.PORT });
    console.log(`Serve is running at post ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
