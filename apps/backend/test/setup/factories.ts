const defaults = { name: "My Website", domain: "example.com", timezone: "UTC" };

export const buildWebsiteInput = (overrides: Partial<typeof defaults> = {}) => ({
  ...defaults,
  ...overrides
});
