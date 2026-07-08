import { c as defineEventHandler, e as setHeader, f as setResponseStatus, r as readBody, u as useRuntimeConfig } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const chat_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  if (event.node.req.method !== "POST") {
    setHeader(event, "Allow", "POST");
    setResponseStatus(event, 405);
    return {
      content: "Method not allowed.",
      provider: "error"
    };
  }
  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "Pragma", "no-cache");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "Referrer-Policy", "no-referrer");
  let body;
  try {
    body = await readBody(event);
  } catch {
    setResponseStatus(event, 400);
    return {
      content: "Invalid JSON body.",
      provider: "error"
    };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    setResponseStatus(event, 400);
    return {
      content: "Invalid request body.",
      provider: "error"
    };
  }
  const clientMessages = Object.prototype.hasOwnProperty.call(body, "messages") ? body.messages : void 0;
  if (!Array.isArray(clientMessages)) {
    setResponseStatus(event, 400);
    return {
      content: "Invalid message format.",
      provider: "error"
    };
  }
  if (clientMessages.length > 50) {
    setResponseStatus(event, 413);
    return {
      content: "Too many messages.",
      provider: "error"
    };
  }
  const allowedRoles = [
    "user",
    "assistant"
  ];
  const validMessages = clientMessages.every(
    (msg) => msg && typeof msg === "object" && !Array.isArray(msg) && typeof msg.role === "string" && typeof msg.content === "string" && allowedRoles.includes(msg.role) && msg.content.trim().length > 0 && msg.content.length <= 1e4
  );
  if (!validMessages) {
    setResponseStatus(event, 400);
    return {
      content: "Invalid message structure.",
      provider: "error"
    };
  }
  const cleanMessages = clientMessages.map((msg) => ({
    role: msg.role,
    content: msg.content.trim()
  }));
  const config = useRuntimeConfig();
  const apiKey = config.groqApiKey || "";
  const OLLAMA_TARGET = config.homeOllamaUrl || "http://localhost:11434";
  const systemPrompt = typeof config.bananaSystemPrompt === "string" && config.bananaSystemPrompt.trim().length > 0 ? config.bananaSystemPrompt.trim() : "You are the secure BANANA Core system assistant.";
  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...cleanMessages
  ];
  let payloadSize = 0;
  try {
    payloadSize = Buffer.byteLength(
      JSON.stringify(messages),
      "utf8"
    );
  } catch {
    setResponseStatus(event, 400);
    return {
      content: "Invalid message format.",
      provider: "error"
    };
  }
  if (payloadSize > 5e4) {
    setResponseStatus(event, 413);
    return {
      content: "Message payload too large.",
      provider: "error"
    };
  }
  try {
    const response = await fetch(
      `${OLLAMA_TARGET}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3.1",
          messages,
          stream: false,
          options: {
            num_ctx: 16384,
            temperature: 0.7
          }
        }),
        signal: AbortSignal.timeout(1e4)
      }
    );
    if (response.ok) {
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid Ollama JSON.");
      }
      if (!data || typeof data !== "object" || typeof ((_a = data == null ? void 0 : data.message) == null ? void 0 : _a.content) !== "string") {
        throw new Error("Invalid Ollama response.");
      }
      const content = data.message.content.trim();
      if (content) {
        return {
          content,
          provider: "ollama"
        };
      }
    }
  } catch (error) {
    if ((error == null ? void 0 : error.name) === "AbortError" || (error == null ? void 0 : error.name) === "TimeoutError" || (error == null ? void 0 : error.code) === "ABORT_ERR") {
      console.log("[BANANA] Ollama timeout.");
    } else {
      console.log("[BANANA] Ollama unavailable.");
    }
  }
  try {
    if (!apiKey) {
      throw new Error(
        "Missing Groq API key."
      );
    }
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          max_tokens: 1025,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(15e3)
      }
    );
    if (!response.ok) {
      throw new Error(
        `Groq HTTP ${response.status}`
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Invalid Groq JSON."
      );
    }
    if (!data || !Array.isArray(data.choices) || typeof ((_d = (_c = (_b = data == null ? void 0 : data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) !== "string") {
      throw new Error("Invalid Groq response.");
    }
    const content = data.choices[0].message.content.trim();
    if (!content) {
      throw new Error(
        "Empty Groq response."
      );
    }
    return {
      content,
      provider: "groq"
    };
  } catch (error) {
    console.error(
      "[BANANA] Gateway failure:",
      (error == null ? void 0 : error.message) || error
    );
    setResponseStatus(event, 500);
    return {
      content: "Connection Error: BANANA Core systems are unreachable.",
      provider: "error"
    };
  }
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
