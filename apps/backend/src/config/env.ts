import { FastifyEnvOptions } from "@fastify/env";

export const envSchema = {
  type: "object",
  required: ["DATABASE_URL"],
  properties: {
    PORT: {
      type: "integer",
      default: 3000
    },
    DATABASE_URL: {
      type: "string",
      minLength: 1
    }
  }
};

export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
}

export const envOptions: FastifyEnvOptions = {
  confKey: "config",
  schema: envSchema,
  dotenv: true
};
