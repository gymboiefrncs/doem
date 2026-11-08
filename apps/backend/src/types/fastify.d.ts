import { EnvConfig } from "../config/env.ts";

declare module "fastify" {
  interface FastifyInstance {
    config: EnvConfig;
  }
}

export {};
