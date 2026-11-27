import { initalize } from "./client";

declare global {
  interface Window {
    doem: Awaited<ReturnType<typeof initalize>>;
    doemReady: ReturnType<typeof initalize>;
  }
}

export {};
