import Fastify from "fastify";
import databasePlugin from "./plugins/database.js";

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

  app.register(databasePlugin);

  return app;
};
