export const getVisitorId = (websiteId: string): string => {
  const storageKey = `doem:visitor:${websiteId}`;

  const existingVisitorId = localStorage.getItem(storageKey);

  if (existingVisitorId) return existingVisitorId;

  const visitorId = crypto.randomUUID();

  localStorage.setItem(storageKey, visitorId);

  return visitorId;
};
