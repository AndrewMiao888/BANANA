import { c as defineEventHandler, r as readBody, u as useRuntimeConfig } from '../../_/nitro.mjs';
import { s as systemPrompts } from '../../_/agents.mjs';
import { A as AVAILABLE_MODELS } from '../../_/models.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const chat_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  try {
    const body = await readBody(event);
    const { messages, selectedModelId, summaryContext } = body;
    const config = useRuntimeConfig();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        success: true,
        source: "System Engine Shield",
        message: {
          role: "assistant",
          content: "\u{1F527} **Diagnostics Confirmation**: Empty or malformed payload packet received."
        }
      };
    }
    const modelConfig = ((_a = AVAILABLE_MODELS) == null ? void 0 : _a.find((m) => m.id === selectedModelId)) || ((_b = AVAILABLE_MODELS) == null ? void 0 : _b[0]) || {
      id: selectedModelId || "Enterprise-NANA",
      name: "Enterprise-NANA",
      provider: "groq"
    };
    const incomingUserPrompt = ((_c = messages[messages.length - 1]) == null ? void 0 : _c.content) || "";
    const cleanHistory = messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content).map((m) => ({
      role: m.role,
      content: String(m.content).trim()
    }));
    const MAX_API_CONTEXT_TURNS = 10;
    const recentHistory = cleanHistory.length > MAX_API_CONTEXT_TURNS ? cleanHistory.slice(-MAX_API_CONTEXT_TURNS) : cleanHistory;
    const olderTurns = cleanHistory.length > MAX_API_CONTEXT_TURNS ? cleanHistory.slice(0, cleanHistory.length - MAX_API_CONTEXT_TURNS) : [];
    const compiledOlderHistoryContext = olderTurns.length > 0 ? `[COMPRESSED BACKGROUND CHAT HISTORY (${olderTurns.length} earlier turns)]:
` + olderTurns.map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 120)}${m.content.length > 120 ? "..." : ""}`).join("\n") : "";
    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE");
    const currentModelName = modelConfig.name || selectedModelId || "Enterprise-NANA";
    const mergedKnowledgePacket = [summaryContext, compiledOlderHistoryContext].filter(Boolean).join("\n\n");
    const comprehensiveSystemPrompt = isSummaryRequest ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler." : `System Identity: You are BANANA Intelligence running on the model "${currentModelName}". If asked which model, engine, or AI agent you are, state truthfully that you are running on ${currentModelName}.

${((_d = systemPrompts) == null ? void 0 : _d.chatAgent) || ""}

[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:
${mergedKnowledgePacket || "No historical data compiled."}`;
    const baseContextMessages = [
      { role: "system", content: comprehensiveSystemPrompt.trim() },
      ...recentHistory
    ];
    let finalResponseText = "";
    let activeExecutionSource = "";
    const localBaseUrl = config.homeOllamaUrl || process.env.HOME_OLLAMA_URL || "https://xps9530-haydenk.tailb68230.ts.net";
    const targetLocalEndpoint = `${localBaseUrl.replace(/\/$/, "")}/api/chat`;
    let isLocalHardwareOnline = false;
    try {
      const probeUrl = `${localBaseUrl.replace(/\/$/, "")}/api/tags`;
      const healthCheck = await $fetch(probeUrl, { method: "GET", timeout: 1500 });
      isLocalHardwareOnline = !!healthCheck;
    } catch {
      isLocalHardwareOnline = false;
    }
    if (isLocalHardwareOnline) {
      try {
        const localModelId = modelConfig.id || selectedModelId || "llama3";
        const ollamaRes = await $fetch(targetLocalEndpoint, {
          method: "POST",
          body: { model: localModelId, messages: baseContextMessages, stream: false },
          timeout: 15e3
        });
        finalResponseText = ((_e = ollamaRes == null ? void 0 : ollamaRes.message) == null ? void 0 : _e.content) || "";
        if (finalResponseText) {
          activeExecutionSource = `${currentModelName} (Hard Drive Local Execution)`;
        }
      } catch (localErr) {
        console.warn("Local hard drive execution dropped. Auto-failing over to Groq cloud...");
      }
    }
    if (!finalResponseText) {
      const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
      if (!apiKey) {
        return {
          success: true,
          source: "System Safe Mode Router",
          message: {
            role: "assistant",
            content: "\u26A0\uFE0F **Deployment Sync Alert**: Hard Drive offline and missing `GROQ_API_KEY` in environment config."
          }
        };
      }
      const primaryCloudModel = "llama-3.1-8b-instant";
      try {
        const groqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: {
            model: primaryCloudModel,
            messages: baseContextMessages
          }
        });
        finalResponseText = ((_h = (_g = (_f = groqRes == null ? void 0 : groqRes.choices) == null ? void 0 : _f[0]) == null ? void 0 : _g.message) == null ? void 0 : _h.content) || "";
        if (finalResponseText) {
          activeExecutionSource = "Instant-NANA (Groq Fallback: Instant 8B)";
        }
      } catch (groqInstantErr) {
        console.warn("Groq Instant model failed, escalating to Level 2 Fallback (Versatile 70B)...", groqInstantErr == null ? void 0 : groqInstantErr.message);
        try {
          const secondaryCloudModel = "llama-3.3-70b-versatile";
          const fallbackGroqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: {
              model: secondaryCloudModel,
              messages: baseContextMessages
            }
          });
          finalResponseText = ((_k = (_j = (_i = fallbackGroqRes == null ? void 0 : fallbackGroqRes.choices) == null ? void 0 : _i[0]) == null ? void 0 : _j.message) == null ? void 0 : _k.content) || "";
          if (finalResponseText) {
            activeExecutionSource = "Instant-NANA (Groq Secondary Fallback: Versatile 70B)";
          }
        } catch (groqVersatileErr) {
          console.error("All Groq cloud execution paths failed:", groqVersatileErr == null ? void 0 : groqVersatileErr.message);
        }
      }
    }
    const userExplicitlyTriggered = incomingUserPrompt.toLowerCase().trim().startsWith("/search");
    const implicitSearchTriggers = [
      "i don't know",
      "i do not know",
      "don't have real-time",
      "unknown context",
      "need to search",
      "information cut-off",
      "current data is unavailable",
      "cannot verify",
      "well, i don't know the answer",
      "latest weather",
      "currently in tokyo",
      "latest news",
      "current events",
      "recent developments",
      "up-to-date information",
      "beyblade",
      "latest sports scores",
      "current stock prices",
      "recent scientific discoveries",
      "latest technology trends",
      "current political events",
      "recent cultural events",
      "latest entertainment news",
      "current economic indicators",
      "recent health updates",
      "latest travel advisories",
      "latest",
      "newest",
      "recent",
      "current",
      "up-to-date",
      "latest information",
      "recent news",
      "current events",
      "latest updates",
      "recent developments",
      "current trends",
      "latest research",
      "recent findings",
      "current statistics",
      "latest data",
      "recent reports",
      "current analysis",
      "latest insights",
      "0000",
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "0010",
      "0011",
      "0012",
      "0013",
      "0014",
      "0015",
      "0016",
      "0017",
      "0018",
      "0019",
      "0020",
      "ancient",
      "history",
      "historical",
      "archaeology",
      "archaeological",
      "ruins",
      "artifacts",
      "civilization",
      "ancient times",
      "historical events",
      "ancient cultures",
      "historical sites",
      "ancient civilizations",
      "historical artifacts",
      "ancient history",
      "historical research",
      "ancient ruins",
      "historical significance",
      "cultures",
      "archaeological discoveries",
      "ancient civilizations",
      "historical analysis",
      "ancient artifacts",
      "historical context",
      "ancient societies",
      "historical records",
      "ancient architecture",
      "historical preservation",
      "ancient texts",
      "historical documentation",
      "ancient traditions",
      "historical interpretation",
      "ancient legends",
      "historical narratives"
    ];
    const aiWantsSearchTriggered = implicitSearchTriggers.some(
      (trigger) => finalResponseText.toLowerCase().includes(trigger)
    );
    if ((userExplicitlyTriggered || aiWantsSearchTriggered) && !isSummaryRequest && finalResponseText) {
      try {
        const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
        const searchPhrase = incomingUserPrompt.replace(/\/search\s*/i, "").trim();
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchPhrase)}&format=json`;
        const searchResults = await $fetch(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const extractedFact = (searchResults == null ? void 0 : searchResults.AbstractText) || ((_m = (_l = searchResults == null ? void 0 : searchResults.RelatedTopics) == null ? void 0 : _l[0]) == null ? void 0 : _m.Text) || "No direct summary packet returned.";
        const patchedSearchContext = [
          {
            role: "system",
            content: `${comprehensiveSystemPrompt}

[LIVE SEARCH TELEMETRY DATA]:
${extractedFact}

Integrate this live telemetry data directly into your answer.`
          },
          ...recentHistory
        ];
        if (isLocalHardwareOnline) {
          const localSearchRes = await $fetch(targetLocalEndpoint, {
            method: "POST",
            body: { model: modelConfig.id || "llama3", messages: patchedSearchContext, stream: false },
            timeout: 1e4
          });
          if ((_n = localSearchRes == null ? void 0 : localSearchRes.message) == null ? void 0 : _n.content) {
            finalResponseText = localSearchRes.message.content;
            activeExecutionSource += " + Autonomous Web Search";
          }
        } else if (apiKey) {
          const searchGroqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: {
              model: "llama-3.1-8b-instant",
              messages: patchedSearchContext
            }
          });
          if ((_q = (_p = (_o = searchGroqRes == null ? void 0 : searchGroqRes.choices) == null ? void 0 : _o[0]) == null ? void 0 : _p.message) == null ? void 0 : _q.content) {
            finalResponseText = searchGroqRes.choices[0].message.content;
            activeExecutionSource += " + Autonomous Web Search";
          }
        }
      } catch (searchErr) {
        console.warn("Network search layers dropped packet.", searchErr);
      }
    }
    if (!finalResponseText) {
      finalResponseText = "\u26A0\uFE0F **System Operational Alert**: Unable to retrieve response matrix from local hard drive node or Groq cloud infrastructure. Please check network connections.";
      activeExecutionSource = "System Safeguard Fallback";
    }
    return {
      success: true,
      source: activeExecutionSource,
      message: { role: "assistant", content: finalResponseText }
    };
  } catch (err) {
    return {
      success: true,
      source: "Internal Error Diagnostics Recovery Mode",
      message: {
        role: "assistant",
        content: `\u{1F527} **Pipeline Recovery Confirmation**: Fail-safe operational path locked down.

* **Status**: Stabilized
* **Log Trace**: ${(err == null ? void 0 : err.message) || "Validation standard reset complete"}`
      }
    };
  }
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
