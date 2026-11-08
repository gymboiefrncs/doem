import { createHash, createHmac, randomBytes } from "node:crypto";

export const generateSecret = (): string => {
  return randomBytes(32).toString("hex");
};

export const hashSecret = (secret: string, pepper: string): string => {
  return createHmac("sha256", pepper).update(secret).digest("hex");
};
