import { c as defineEventHandler, u as useRuntimeConfig } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const AVAILABLE_MODELS = [
  // --- LOCAL COMPUTER MODELS (Free, Unlimited) ---
  {
    id: "qwen-super:latest",
    name: "Qwen Super Engine",
    provider: "local",
    tier: "High Demand",
    description: "Primary custom local logic and coding engine."
  },
  {
    id: "llava:latest",
    name: "Vision-NANA",
    provider: "local",
    tier: "Unlimited",
    description: "Local multimodal visual structural processing."
  },
  // --- CLOUD FALLBACK MODEL (Groq API) ---
  {
    id: "llama-3.1-8b-instant",
    name: "Instant-NANA (Cloud)",
    provider: "groq",
    tier: "Instant",
    description: "Ultra-fast cloud processing core (used if local is offline)."
  }
];

const models = defineEventHandler(async () => {
  let isLocalComputerOnline = false;
  const config = useRuntimeConfig();
  const localBaseUrl = config.homeOllamaUrl || process.env.HOME_OLLAMA_URL || "https://xps9530-haydenk.tailb68230.ts.net";
  try {
    await $fetch(`${localBaseUrl}/`, { method: "GET", timeout: 1e3 });
    isLocalComputerOnline = true;
  } catch {
    isLocalComputerOnline = false;
  }
  const filteredModels = AVAILABLE_MODELS.filter((model) => {
    if (model.provider === "local") {
      return isLocalComputerOnline;
    }
    return true;
  });
  return {
    localComputerStatus: isLocalComputerOnline ? "ONLINE" : "OFFLINE",
    models: filteredModels
  };
});

export { models as default };
//# sourceMappingURL=models.mjs.map
