const SESSION_TIMEOUT = 30 * 60 * 1000;

export interface SessionData {
  sessionId: string;
  lastActivity: number;
}

const readSession = (storageKey: string): SessionData | null => {
  const storedSession = localStorage.getItem(storageKey);
  if (!storedSession) return null;

  try {
    const parsed: unknown = JSON.parse(storedSession);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("sessionId" in parsed) ||
      !("lastActivity" in parsed)
    )
      return null;

    if (typeof parsed.sessionId !== "string" || typeof parsed.lastActivity !== "number")
      return null;

    return {
      sessionId: parsed.sessionId,
      lastActivity: parsed.lastActivity
    };
  } catch (error) {
    return null;
  }
};

export const getOrCreateSession = (websiteId: string): SessionData => {
  const storageKey = `doem:session:${websiteId}`;

  const existingSession = readSession(storageKey);

  const isExpired = !existingSession || Date.now() - existingSession.lastActivity > SESSION_TIMEOUT;

  const session: SessionData = {
    sessionId: isExpired ? crypto.randomUUID() : existingSession.sessionId,
    lastActivity: Date.now()
  };

  localStorage.setItem(storageKey, JSON.stringify(session));

  return session;
};
