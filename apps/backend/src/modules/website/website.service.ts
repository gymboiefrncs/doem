import type { RegisterWebsiteInput, RegisterWebsiteResponse } from "@doem/shared";
import type { FastifyInstance } from "fastify";
import { generateSecret, hashSecret } from "../../utils/crypto.js";
import { websiteRepository } from "./website.repository.js";
import { DuplicateResourceError } from "../../errors/domain.errors.js";

type WebsiteRepository = ReturnType<typeof websiteRepository>;

export const websiteService = (repo: WebsiteRepository, tokenSecret: string) => {
  return {
    async register(data: RegisterWebsiteInput): Promise<RegisterWebsiteResponse> {
      try {
        const { name, domain, timezone } = data;
        const dashboardAccessToken = generateSecret();
        const recoveryKey = generateSecret();
        const dashboardAccessTokenHash = hashSecret(dashboardAccessToken, tokenSecret);
        const recoveryKeyHash = hashSecret(recoveryKey, tokenSecret);

        const savedWebsite = await repo.insert({
          name,
          domain,
          timezone,
          dashboardAccessTokenHash,
          recoveryKeyHash
        });

        return {
          ...savedWebsite,
          dashboardAccessToken,
          recoveryKey
        };
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && "constraint" in error) {
          if (error.code === "23505" && error.constraint === "domain_unique_constraint") {
            throw new DuplicateResourceError(`Website with domain ${data.domain} already exists.`);
          }
        }
        throw error;
      }
    }
  };
};
