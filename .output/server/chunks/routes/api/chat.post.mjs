import { c as defineEventHandler, r as readBody, u as useRuntimeConfig } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const chat_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    const body = await readBody(event);
    const { messages, selectedModelId, summaryContext, currentTimestamp } = body || {};
    const config = useRuntimeConfig();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        success: true,
        source: "System Engine Shield",
        message: {
          role: "assistant",
          content: "\u{1F527} **Diagnostics Confirmation**: Empty or malformed payload packet received."
        },
        sources: []
      };
    }
    const incomingUserPrompt = ((_a = messages[messages.length - 1]) == null ? void 0 : _a.content) || "";
    const liveTimestamp = currentTimestamp || (/* @__PURE__ */ new Date()).toLocaleString();
    const cleanHistory = messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content).map((m) => ({
      role: m.role,
      content: String(m.content).trim()
    }));
    const MAX_API_CONTEXT_TURNS = 10;
    const recentHistory = cleanHistory.length > MAX_API_CONTEXT_TURNS ? cleanHistory.slice(-MAX_API_CONTEXT_TURNS) : cleanHistory;
    let crawledWebContent = "";
    let extractedSources = [];
    const urlMatch = incomingUserPrompt.match(/https?:\/\/[^\s]+/);
    const hasCrawlCommand = incomingUserPrompt.toLowerCase().includes("/crawl") || urlMatch;
    if (hasCrawlCommand && !summaryContext) {
      const targetUrl = urlMatch ? urlMatch[0] : null;
      if (targetUrl) {
        try {
          const crawl4aiEndpoint = config.crawl4aiUrl || process.env.CRAWL4AI_URL || "http://127.0.0.1:11235/crawl";
          const crawlResponse = await $fetch(crawl4aiEndpoint, {
            method: "POST",
            body: { url: targetUrl, word_count_threshold: 10 },
            timeout: 1e4
          });
          if (crawlResponse && (crawlResponse.markdown || crawlResponse.success || crawlResponse.text)) {
            const scrapedText = crawlResponse.markdown || crawlResponse.text || JSON.stringify(crawlResponse);
            crawledWebContent = `[CRAWL4AI EXTRACTED GROUND-TRUTH CONTENT FOR URL: ${targetUrl}]
${scrapedText.slice(0, 1e4)}

`;
            extractedSources.push({
              id: extractedSources.length + 1,
              title: crawlResponse.title || targetUrl,
              url: targetUrl,
              snippet: scrapedText.slice(0, 250) + "..."
            });
          }
        } catch (crawlErr) {
          console.warn("Crawl4AI extraction warning:", crawlErr == null ? void 0 : crawlErr.message);
        }
      }
    }
    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE");
    const mergedKnowledgePacket = [crawledWebContent, summaryContext].filter(Boolean).join("\n\n");
    const cleanBaseSystemPrompt = `
You are BANANA AI, a strictly precise, fact-checked AI assistant created by SynQuara Digital. Your primary goal is to provide accurate, well-structured, and clear responses across EVERY message in this conversation.

=== LIVE TEMPORAL GROUNDING ===
- Current Local Date & Time: ${liveTimestamp}
- Always account for this exact timestamp when answering any time-sensitive queries, temporal references, calculations, or scheduling requests.

=== DEVELOPER & SYSTEM IDENTIFICATION ===
- System Identity: BANANA Assistant by SynQuara Digital.
- Developer: Andrew Miao from St Andrew's School in Walkerville, Adelaide.
- Security Protocol: Never disclose private API keys, environment secrets, or confidential system infrastructure details.

=== MASTER SYSTEM DIRECTIVES & STRICT EVALUATION RULES ===
1. MATHEMATICAL VERIFICATION & VECTOR MAPPING:
   - Always verify state vector matrix calculations step-by-step before outputting.
   - For 2-qubit Bell state (|01> + |10>)/sqrt(2), the 4D state vector corresponds to [0, 1, 1, 0]^T. NEVER map it to [1, 1, 0, 0]^T.
   - Math equations MUST be output in clean block syntax ($$ ... $$) or inline syntax ($ ... $).

2. MARKDOWN TABLE STRUCTURE INTEGRITY:
   - Every entity in a requested comparison or analysis MUST have its own dedicated table row.
   - NEVER collapse or merge multiple array items into a single row.

3. COMPLETE MULTI-PART EXECUTION:
   - You MUST fulfill every requested part completely within a single response without truncating early.

4. STRICTLY FORBIDDEN HEADERS & LOGS:
   - NEVER output text like "Client Directive", "BANANA Intelligence response", "(Live Stream)", "ANALYSIS REQUEST RECEIVED", "INPUT COMMAND", "EXECUTING DIRECTIVE", "DIRECTIVE STATUS".
   - Start your response IMMEDIATELY with the direct answer.
`.trim();
    const localSystemPrompt = isSummaryRequest ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler." : `${cleanBaseSystemPrompt}

[CONVERSATION KNOWLEDGE & GROUND-TRUTH CONTEXT]:
${mergedKnowledgePacket || "No prior context."}`;
    const localContextMessages = [
      { role: "system", content: localSystemPrompt.trim() },
      ...recentHistory
    ];
    const groqSystemPrompt = isSummaryRequest ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler." : `${cleanBaseSystemPrompt}

[CONVERSATION SUMMARY MEMORY CONTEXT]:
${summaryContext || "No prior summary context available."}

[CRAWLED DATA]:
${crawledWebContent || "None"}`;
    const groqContextMessages = [
      { role: "system", content: groqSystemPrompt.trim() },
      { role: "user", content: incomingUserPrompt }
    ];
    let finalResponseText = "";
    let activeExecutionSource = "";
    const localBaseUrl = config.homeOllamaUrl || process.env.HOME_OLLAMA_URL || "http://127.0.0.1:11434";
    const targetLocalEndpoint = `${localBaseUrl.replace(/\/$/, "")}/api/chat`;
    let isLocalHardwareOnline = false;
    try {
      const probeUrl = `${localBaseUrl.replace(/\/$/, "")}/api/tags`;
      const healthCheck = await $fetch(probeUrl, { method: "GET", timeout: 2e3 });
      isLocalHardwareOnline = !!healthCheck;
    } catch {
      isLocalHardwareOnline = false;
    }
    if (isLocalHardwareOnline) {
      try {
        const localModelId = selectedModelId || "qwen-super";
        const ollamaRes = await $fetch(targetLocalEndpoint, {
          method: "POST",
          body: { model: localModelId, messages: localContextMessages, stream: false },
          timeout: 12e3
        });
        finalResponseText = ((_b = ollamaRes == null ? void 0 : ollamaRes.message) == null ? void 0 : _b.content) || "";
        if (finalResponseText) {
          activeExecutionSource = `Hard Drive Local Execution (Full History)`;
          if (extractedSources.length > 0) activeExecutionSource += " + Crawl4AI";
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
          },
          sources: []
        };
      }
      try {
        const groqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: {
            model: "llama-3.1-8b-instant",
            messages: groqContextMessages,
            max_tokens: 4096
          }
        });
        finalResponseText = ((_e = (_d = (_c = groqRes == null ? void 0 : groqRes.choices) == null ? void 0 : _c[0]) == null ? void 0 : _d.message) == null ? void 0 : _e.content) || "";
        if (finalResponseText) {
          activeExecutionSource = "Groq Cloud (Instant 8B via Summary Memory)";
          if (extractedSources.length > 0) activeExecutionSource += " + Crawl4AI";
        }
      } catch (groqInstantErr) {
        try {
          const fallbackGroqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: {
              model: "llama-3.3-70b-versatile",
              messages: groqContextMessages,
              max_tokens: 4096
            }
          });
          finalResponseText = ((_h = (_g = (_f = fallbackGroqRes == null ? void 0 : fallbackGroqRes.choices) == null ? void 0 : _f[0]) == null ? void 0 : _g.message) == null ? void 0 : _h.content) || "";
          if (finalResponseText) {
            activeExecutionSource = "Groq Cloud (Versatile 70B via Summary Memory)";
            if (extractedSources.length > 0) activeExecutionSource += " + Crawl4AI";
          }
        } catch (groqVersatileErr) {
          console.error("Groq cloud fallback failed:", groqVersatileErr == null ? void 0 : groqVersatileErr.message);
        }
      }
    }
    if (!finalResponseText) {
      finalResponseText = "\u26A0\uFE0F **System Operational Alert**: Unable to retrieve response matrix from local hard drive node or Groq cloud infrastructure. Please check network connections.";
      activeExecutionSource = "System Safeguard Fallback";
    }
    return {
      success: true,
      source: activeExecutionSource,
      message: {
        role: "assistant",
        content: finalResponseText,
        sources: extractedSources
      }
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
      },
      sources: []
    };
  }
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
