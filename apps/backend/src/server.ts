import { buildApp } from "./app.js";

const start = async () => {
  try {
    const fastify = await buildApp();
    await fastify.listen({ port: fastify.config.PORT });
    fastify.log.info(`Server is running on port ${fastify.config.PORT}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
