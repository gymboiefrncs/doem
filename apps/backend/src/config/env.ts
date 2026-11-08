import { FastifyEnvOptions } from "@fastify/env";

export const envSchema = {
  type: "object",
  required: ["DATABASE_URL", "TOKEN_SECRET"],
  properties: {
    PORT: {
      type: "integer",
      default: 3000
    },
    DATABASE_URL: {
      type: "string",
      minLength: 1
    },
    TOKEN_SECRET: {
      type: "string"
    }
  }
};

export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  TOKEN_SECRET: string;
}

export const envOptions: FastifyEnvOptions = {
  confKey: "config",
  schema: envSchema,
  dotenv: true
};
