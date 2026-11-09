import { initalize } from "./client";

const script = document.currentScript;

if (!(script instanceof HTMLScriptElement)) {
  throw new Error("[DOEM] Unable to identify SDK script element.");
}

const websiteId = script.dataset.websiteId;

initalize({ websiteId });
