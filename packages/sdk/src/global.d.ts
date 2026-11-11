import { initalize } from "./client";

declare global {
  interface Window {
    doem: ReturnType<typeof initalize>;
  }
}

export {};
