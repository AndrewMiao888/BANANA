import { c as defineEventHandler } from '../../_/nitro.mjs';
import { A as AVAILABLE_MODELS } from '../../_/models.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const models = defineEventHandler(async () => {
  let isLocalComputerOnline = false;
  try {
    await $fetch("http://127.0.0.1:11434/", { method: "GET", timeout: 1e3 });
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
