// Helper to build a summary incrementally without checking old history again
async function updateIncrementalSummary(oldSummary: string, newTurn: any, apiKey: string): Promise<string> {
  try {
    const contextText = oldSummary 
      ? `Current Summary: "${oldSummary}". New conversation turn to append: ${JSON.stringify(newTurn)}`
      : `New conversation turn: ${JSON.stringify(newTurn)}`;

    const response = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: 'You are a memory processor. Update the current summary by seamlessly incorporating the information from the new conversation turn. Keep the output as a single, highly dense, concise paragraph.' 
          },
          { role: 'user', content: contextText }
        ],
        max_tokens: 200
      })
    });
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || oldSummary || "Previous conversation context.";
  } catch {
    return oldSummary || "Error updating history context.";
  }
}

import {
  defineEventHandler,
  readBody,
  setResponseStatus,
  setHeader
} from "h3";

import {
  useRuntimeConfig
} from "nitropack/runtime";

export default defineEventHandler(async (event) => {

  // =====================================================
  // 0. REQUEST METHOD PROTECTION
  // =====================================================

 if (event.node.req.method !== "POST") {

    setHeader(event, "Allow", "POST");
    setResponseStatus(event, 405);

    return {
      content: "Method not allowed.",
      provider: "error"
    };
  }

  // =====================================================
  // SECURITY HEADERS
  // =====================================================

  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "Pragma", "no-cache");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "Referrer-Policy", "no-referrer");

  // =====================================================
  // 1. READ REQUEST BODY
  // =====================================================

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

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    setResponseStatus(event, 400);

    return {
      content: "Invalid request body.",
      provider: "error"
    };
  }

const clientMessages =
  Object.prototype.hasOwnProperty.call(body, "messages")
    ? body.messages
    : undefined;

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

  // =====================================================
  // 2. MESSAGE VALIDATION
  // =====================================================

  const allowedRoles = [
    "user",
    "assistant"
  ];

  const validMessages = clientMessages.every(
    (msg) =>
      msg &&
      typeof msg === "object" &&
      !Array.isArray(msg) &&
      typeof msg.role === "string" &&
      typeof msg.content === "string" &&
      allowedRoles.includes(msg.role) &&
      msg.content.trim().length > 0 &&
      msg.content.length <= 10000
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

  // =====================================================
  // 3. CONFIGURATION
  // =====================================================

  const config = useRuntimeConfig();

  const apiKey = config.groqApiKey || "";

  const OLLAMA_TARGET =
    config.homeOllamaUrl ||
    "http://localhost:11434";

  const systemPrompt =
    typeof config.bananaSystemPrompt === "string" &&
    config.bananaSystemPrompt.trim().length > 0
      ? config.bananaSystemPrompt.trim()
      : "You are the secure BANANA Core system assistant.";

  // =====================================================
  // 4. BUILD TRUSTED MESSAGE PAYLOAD
  // =====================================================

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

  if (payloadSize > 50000) {
    setResponseStatus(event, 413);

    return {
      content: "Message payload too large.",
      provider: "error"
    };
  }

  // =====================================================
  // 5. OLLAMA FIRST
  // =====================================================

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

        signal: AbortSignal.timeout(10000)
      }
    );

    if (response.ok) {

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid Ollama JSON.");
      }

    if (
  !data ||
  typeof data !== "object" ||
  typeof data?.message?.content !== "string"
) {
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

  } catch (error: any) {

    if (
      error?.name === "AbortError" ||
      error?.name === "TimeoutError" ||
      error?.code === "ABORT_ERR"
    ) {
      console.log("[BANANA] Ollama timeout.");
    } else {
      console.log("[BANANA] Ollama unavailable.");
    }
  }

  // =====================================================
  // 6. GROQ FALLBACK (INCREMENTAL MEMORY LAYER)
  // =====================================================

  try {
    if (!apiKey) {
      throw new Error("Missing Groq API key.");
    }

    // Extract incoming summary state from frontend body
    const existingSummary = body.existingSummary || "";
    
    // Grab just the latest exchange turn (the last assistant reply + the new user question)
    const lastTwoMessages = cleanMessages.slice(-2); 

    // 💡 Update the summary using ONLY the new turn, avoiding re-reading the entire message array!
    const updatedSummary = await updateIncrementalSummary(existingSummary, lastTwoMessages, apiKey);
    const latestUserMessage = cleanMessages[cleanMessages.length - 1];

    const optimizedCloudMessages = [
      { 
        role: "system", 
        content: `${systemPrompt}\n\n[CONVERSATION SUMMARY CONTEXT]: ${updatedSummary}` 
      },
      latestUserMessage
    ];

    const response = await fetch(
      "https://api.groq.com/openapi/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: optimizedCloudMessages,
          max_tokens: 1025,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      throw new Error(`Groq HTTP ${response.status}`);
    }

    let data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty Groq response.");
    }

    // Return the answer AND the updated summary so the frontend saves it for next time!
    return {
      content,
      provider: "groq",
      updatedSummary: updatedSummary 
    };

 } catch (error: any) {
    console.error("[BANANA] Gateway failure:", error?.message || error);
    setResponseStatus(event, 500);
    return {
      content: "Connection Error: BANANA Core systems are unreachable.",
      provider: "error"
    };
  }
});