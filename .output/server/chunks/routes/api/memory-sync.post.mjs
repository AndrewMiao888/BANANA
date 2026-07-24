import { c as defineEventHandler, r as readBody, u as useRuntimeConfig, e as createError } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const memorySync_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const body = await readBody(event);
    const { messages, isLocalComputerOn, currentSummary } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { success: true, summary: currentSummary || "No data generated yet.", extractedMemories: [] };
    }
    const latestUserMessage = ((_a = messages[messages.length - 2]) == null ? void 0 : _a.content) || "";
    const latestAssistantMessage = ((_b = messages[messages.length - 1]) == null ? void 0 : _b.content) || "";
    if (!isLocalComputerOn) {
      const config = useRuntimeConfig();
      const apiKey = config.groqApiKey;
      if (!apiKey) {
        return {
          success: true,
          summary: currentSummary + " (Cloud update skipped: missing auth key)",
          extractedMemories: []
        };
      }
      const incrementalPrompt = [
        {
          role: "system",
          content: "You are a lightweight context extraction utility. Read the latest exchange and output a single sentence update to append to the historical summary. Do not output anything else."
        },
        {
          role: "user",
          content: `Historical Summary: ${currentSummary}

New Exchange:
User: ${latestUserMessage}
Assistant: ${latestAssistantMessage}

Provide the short text to append:`
        }
      ];
      try {
        const groqRes = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: { model: "llama3-8b-8192", messages: incrementalPrompt }
        });
        const appendStr = ((_e = (_d = (_c = groqRes == null ? void 0 : groqRes.choices) == null ? void 0 : _c[0]) == null ? void 0 : _d.message) == null ? void 0 : _e.content) || "";
        const updatedSummary = currentSummary === "No summary computed yet." ? appendStr : `${currentSummary} ${appendStr}`;
        const extractedFact = latestUserMessage.length > 5 && latestUserMessage.length < 100 ? [latestUserMessage.substring(0, 50)] : [];
        return {
          success: true,
          summary: updatedSummary.trim(),
          extractedMemories: extractedFact
        };
      } catch (e) {
        console.warn("Cloud memory update failed:", e);
        return { success: true, summary: currentSummary, extractedMemories: [] };
      }
    }
    const standardPayload = [
      {
        role: "system",
        content: "You are a context processing agent. Read the entire conversation history below and output a concise, clear main idea summary of the user goals and preferences."
      },
      {
        role: "user",
        content: JSON.stringify(messages.map((m) => ({ role: m.role, content: m.content })))
      }
    ];
    try {
      const ollamaRes = await $fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        body: {
          model: "llama3:8b",
          // Uses the Standard local layout matrix
          messages: standardPayload,
          stream: false
        },
        timeout: 5e3
      });
      return {
        success: true,
        summary: ((_f = ollamaRes == null ? void 0 : ollamaRes.message) == null ? void 0 : _f.content) || currentSummary,
        extractedMemories: []
        // No separate caching blocks needed since full history is active
      };
    } catch (localErr) {
      console.warn("Fallback to current status: local re-read timed out.", localErr);
      return { success: true, summary: currentSummary, extractedMemories: [] };
    }
  } catch (globalError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Memory sync failed: ${globalError.message}`
    });
  }
});

export { memorySync_post as default };
//# sourceMappingURL=memory-sync.post.mjs.map
