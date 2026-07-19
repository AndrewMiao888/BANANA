import { c as defineEventHandler, r as readBody, e as createError, u as useRuntimeConfig } from '../../_/nitro.mjs';
import { s as systemPrompts } from '../../_/agents.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const AVAILABLE_MODELS = [
  // --- SINGLE EXCLUSIVE CLOUD MODEL (GROQ) ---
  { id: "llama3-8b-8192", name: "Instant-NANA (Cloud)", provider: "groq", tier: "Instant", description: "Ultra-fast cloud processing core" },
  // --- LOCAL COMPUTER MODELS (Active only when machine is ON) ---
  // Core Compute Tiers
  { id: "llama3:8b", name: "Standard-NANA", provider: "local", tier: "High Demand", description: "Local foundational network" },
  { id: "llama3:70b", name: "Pro-NANA", provider: "local", tier: "High Demand", description: "Heavy local reasoning engine" },
  { id: "llama3.1:8b", name: "Advanced-NANA", provider: "local", tier: "High Demand", description: "Upgraded tools layout execution" },
  { id: "llama3.2:1b", name: "Micro-NANA", provider: "local", tier: "Instant", description: "Minimalist system pipeline footprint" },
  { id: "llama3.2:3b", name: "Lite-NANA", provider: "local", tier: "Instant", description: "Balanced lightweight text handling" },
  // Engineering & Logic Tiers
  { id: "codestral:latest", name: "Dev-NANA", provider: "local", tier: "High Demand", description: "Specialized code completion pipeline" },
  { id: "codequery:latest", name: "Architect-NANA", provider: "local", tier: "High Demand", description: "Heavy codebase synthesis structural layout" },
  { id: "qwen2.5-coder:7b", name: "Syntax-NANA", provider: "local", tier: "High Demand", description: "Optimized parsing engine" },
  { id: "deepseek-coder:6.7b", name: "Logic-NANA", provider: "local", tier: "High Demand", description: "High precision software engineering" },
  { id: "deepseek-coder:33b", name: "Deep-NANA", provider: "local", tier: "High Demand", description: "Complex algorithmic computation array" },
  // Reasoning Tiers
  { id: "mistral:7b", name: "Swift-NANA", provider: "local", tier: "High Demand", description: "High utility processing balance" },
  { id: "phi3:3.8b", name: "Mini-NANA", provider: "local", tier: "Instant", description: "Compact contextual logic matrix" },
  { id: "phi3:medium", name: "Core-NANA", provider: "local", tier: "High Demand", description: "Mid-tier local operational workspace" },
  { id: "qwen2:7b", name: "Global-NANA", provider: "local", tier: "High Demand", description: "Multi-lingual processing pipeline" },
  { id: "qwen2:72b", name: "Apex-NANA", provider: "local", tier: "High Demand", description: "Extreme computational capacity" },
  { id: "command-r:latest", name: "Search-NANA", provider: "local", tier: "High Demand", description: "Advanced search context routing" },
  { id: "command-r-plus:latest", name: "Enterprise-NANA", provider: "local", tier: "High Demand", description: "Massive agent task processing network" },
  { id: "gemma2:27b", name: "Quantum-NANA", provider: "local", tier: "High Demand", description: "Heavy open-weight logic framework" },
  { id: "codegemma:7b", name: "Script-NANA", provider: "local", tier: "High Demand", description: "Fast code helper implementation" },
  // Specialized & Multimodal Vision Tiers
  { id: "llava:latest", name: "Vision-NANA", provider: "local", tier: "Unlimited", description: "Multimodal visual structural processing" },
  { id: "bakllava:latest", name: "Sight-NANA", provider: "local", tier: "Unlimited", description: "Fast local graphic asset analysis" },
  { id: "starcoder2:15b", name: "Matrix-NANA", provider: "local", tier: "High Demand", description: "Raw multi-language token layout" },
  { id: "neural-chat:latest", name: "Synapse-NANA", provider: "local", tier: "Instant", description: "Fine-tuned conversational execution" },
  { id: "solar:10.7b", name: "Ray-NANA", provider: "local", tier: "High Demand", description: "Compact execution architecture" },
  { id: "vicuna:13b", name: "Classic-NANA", provider: "local", tier: "High Demand", description: "Standard traditional dialogue set" },
  { id: "wizardlm2:7b", name: "Spell-NANA", provider: "local", tier: "High Demand", description: "High velocity prompt optimization" },
  { id: "wizardlm2:8x22b", name: "Titan-NANA", provider: "local", tier: "High Demand", description: "Heavy mixture-of-experts logic array" },
  { id: "orca-mini:latest", name: "Pod-NANA", provider: "local", tier: "Instant", description: "Sub-dataset optimization processing" },
  { id: "tinyllama:latest", name: "Nano-NANA", provider: "local", tier: "Instant", description: "Minimal computational framework requirement" }
];

const OLLAMA_TAILSCALE_ENDPOINT = "https://xps9530-haydenk.tailb68230.ts.net/api/chat";
async function executeWebSearchQuery(query) {
  try {
    const searchData = await $fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const snippets = [];
    const matchReg = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = matchReg.exec(searchData)) !== null && snippets.length < 4) {
      snippets.push(match[1].replace(/<[^>]*>/g, "").trim());
    }
    return snippets.join("\n\n");
  } catch (err) {
    console.error("Search Engine Tunnel dropped packet query:", err);
    return "No additional network telemetry found.";
  }
}
const chat_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    const body = await readBody(event);
    const { messages, selectedModelId, summaryContext } = body;
    if (!messages || !Array.isArray(messages)) {
      throw createError({ statusCode: 400, statusMessage: "Malformed text history structure." });
    }
    const modelConfig = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];
    const incomingUserPrompt = ((_a = messages[messages.length - 1]) == null ? void 0 : _a.content) || "";
    const comprehensiveSystemPrompt = `${systemPrompts.chatAgent}

[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:
${summaryContext || "No historical data compiled."}`;
    const baseContextMessages = [
      { role: "system", content: comprehensiveSystemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content }))
    ];
    let finalResponseText = "";
    let activeExecutionSource = `${modelConfig.name} (Tailscale Node)`;
    if (modelConfig.provider === "local") {
      try {
        const ollamaRes = await $fetch(OLLAMA_TAILSCALE_ENDPOINT, {
          method: "POST",
          body: { model: modelConfig.id, messages: baseContextMessages, stream: false },
          timeout: 7e3
          // 7s threshold to allow cloud to tunnel smoothly down to local hardware
        });
        finalResponseText = ((_b = ollamaRes == null ? void 0 : ollamaRes.message) == null ? void 0 : _b.content) || "";
      } catch (localErr) {
        console.warn("Tailscale Funnel node busy or adjusting routing rules. Shunting parameters over to Cloud Core...");
      }
    }
    if (!finalResponseText) {
      const config = useRuntimeConfig();
      const targetCloudModel = modelConfig.provider === "groq" ? modelConfig.id : "llama3-8b-8192";
      activeExecutionSource = modelConfig.provider === "groq" ? `${modelConfig.name} (Cloud Target)` : "Instant-NANA (Cloud Fallback Overdrive)";
      const groqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.groqApiKey}`, "Content-Type": "application/json" },
        body: { model: targetCloudModel, messages: baseContextMessages }
      });
      finalResponseText = ((_e = (_d = (_c = groqRes == null ? void 0 : groqRes.choices) == null ? void 0 : _c[0]) == null ? void 0 : _d.message) == null ? void 0 : _e.content) || "";
    }
    const searchTriggers = [
      "i don't know",
      "i do not know",
      "don't have real-time",
      "unknown context",
      "need to search",
      "information cut-off",
      "current data is unavailable",
      "cannot verify",
      "well, i don't know the answer"
    ];
    const requiresWebTelemetry = searchTriggers.some(
      (trigger) => finalResponseText.toLowerCase().includes(trigger)
    );
    if (requiresWebTelemetry) {
      console.log(`\u{1F310} Mesh Redirect: Model hit validation limits. Initializing live network search parameters...`);
      const networkTelemetryData = await executeWebSearchQuery(incomingUserPrompt);
      const patchedSearchContext = [
        { role: "system", content: `${comprehensiveSystemPrompt}

[LIVE SEARCH TELEMETRY DATA]:
${networkTelemetryData}

Integrate this data payload directly into your response parameters.` },
        ...messages.map((m) => ({ role: m.role, content: m.content }))
      ];
      const config = useRuntimeConfig();
      const searchGroqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.groqApiKey}`, "Content-Type": "application/json" },
        body: { model: "llama3-8b-8192", messages: patchedSearchContext }
      });
      finalResponseText = ((_h = (_g = (_f = searchGroqRes == null ? void 0 : searchGroqRes.choices) == null ? void 0 : _f[0]) == null ? void 0 : _g.message) == null ? void 0 : _h.content) || finalResponseText;
      activeExecutionSource += " + Autonomous Web Search";
    }
    return {
      success: true,
      source: activeExecutionSource,
      message: { role: "assistant", content: finalResponseText }
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: `Orchestrator failed to allocate model matrices: ${err.message}`
    });
  }
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
