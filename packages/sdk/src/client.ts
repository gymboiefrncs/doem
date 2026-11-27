import { createTracker } from "./tracker";

export interface DoemConfig {
  websiteId: string | undefined;
}

const DEFAULT_URL = "http://localhost:3000/api/v1";

export const initialize = async (config: DoemConfig) => {
  const { websiteId } = config;
  if (!websiteId) {
    throw new Error("[DOEM] websiteId is required");
  }

  const tracker = await createTracker({ websiteId, apiUrl: DEFAULT_URL });

  return {
    track: tracker.track,
    trackPageView: tracker.trackPageView
  };
};
