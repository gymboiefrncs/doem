import { initialize } from "./client";

const script = document.currentScript;

if (!(script instanceof HTMLScriptElement)) {
  throw new Error("[DOEM] Unable to identify SDK script element.");
}

const websiteId = script.dataset.websiteId;

window.doemReady = initialize({ websiteId }).then((tracker) => {
  window.doem = tracker;
  return tracker;
});

window.doemReady.catch((error: unknown) => {
  console.error("[DOEM] Failed to initialize SDK:", error);
});
