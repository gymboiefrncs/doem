import type { TrackEvent } from "./tracker";

interface TransportConfig {
  apiUrl: string;
}

export const createTransport = (config: TransportConfig) => {
  const endpoint = `${config.apiUrl}/events`;

  const send = async (event: TrackEvent): Promise<void> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Failed to send event: ${response.status}`);
    }
  };
  return { send };
};
