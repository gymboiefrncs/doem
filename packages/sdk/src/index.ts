import { initialize } from "./client";

const script = document.currentScript;

if (!(script instanceof HTMLScriptElement)) {
  throw new Error("[DOEM] Unable to identify SDK script element.");
}

const websiteId = script.dataset.websiteId;

window.doem = initialize({ websiteId });
