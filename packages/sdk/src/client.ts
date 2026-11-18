import { createTracker } from "./tracker";

export interface DoemConfig {
  websiteId: string | undefined;
}

const DEFAULT_URL = "http://localhost:3000/api/v1";

export const initialize = (config: DoemConfig) => {
  const { websiteId } = config;
  if (!websiteId) {
    throw new Error("[DOEM] websiteId is required");
  }

  const tracker = createTracker({ websiteId, apiUrl: DEFAULT_URL });

  return {
    track: tracker.track
  };
};
