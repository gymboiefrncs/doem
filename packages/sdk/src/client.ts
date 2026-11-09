export interface DoemConfig {
  websiteId: string | undefined;
}

export const initalize = (config: DoemConfig): void => {
  if (!config.websiteId) {
    throw new Error("[DOEM] websiteId is required");
  }

  console.log("[DOEM] initialized:", config.websiteId);
};
