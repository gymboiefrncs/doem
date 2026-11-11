import { createTracker } from "./tracker";

export interface DoemConfig {
  websiteId: string | undefined;
}

export const initialize = (config: DoemConfig) => {
  const { websiteId } = config;
  if (!websiteId) {
    throw new Error("[DOEM] websiteId is required");
  }

  const tracker = createTracker({ websiteId });

  return {
    track: tracker.track
  };
};
