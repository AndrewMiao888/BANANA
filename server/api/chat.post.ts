import {
  defineEventHandler,
  readBody,
  setResponseStatus,
  setHeader
} from "h3";

import {
  useRuntimeConfig
} from "nitropack/runtime";

// ============================================================================
// 🔄 MEMORY PIPELINE: INCREMENTAL SUMMARY UPDATER (GROQ POWERED)
// ============================================================================
async function updateIncrementalSummary(oldSummary: string, newTurn: any[], apiKey: string): Promise<string> {
  try {
    const contextText = oldSummary 
      ? `Current Summary: "${oldSummary}". New conversation turn to append: ${JSON.stringify(newTurn)}`
      : `New conversation turn: ${JSON.stringify(newTurn)}`;

    const response = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json' 
      },
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

export default defineEventHandler(async (event) => {

  // ============================================================================
  // 0. REQUEST METHOD PROTECTION & CORS HEADERS
  // ============================================================================
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

  // ============================================================================
  // 1. READ & VALIDATE REQUEST BODY
  // ============================================================================
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

  const clientMessages = Object.prototype.hasOwnProperty.call(body, "messages")
    ? body.messages
    : undefined;

  const selectedModel = body.model || "Instant-Nana";
  const existingSummary = body.existingSummary || "";

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

  const allowedRoles = ["user", "assistant"];
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
    role: msg.role as "user" | "assistant",
    content: msg.content.trim()
  }));

  // ============================================================================
  // 2. CONFIGURATION MATRIX INITIALIZATION
  // ============================================================================
  const config = useRuntimeConfig();
  const apiKey = config.groqApiKey || "";
  const tavilyApiKey = config.tavilyApiKey || "";
  const OLLAMA_TARGET = config.homeOllamaUrl || "http://localhost:11434";

  const systemPrompt =
    typeof config.bananaSystemPrompt === "string" &&
    config.bananaSystemPrompt.trim().length > 0
      ? config.bananaSystemPrompt.trim()
      : "You are the secure BANANA Core system assistant.";

  // ============================================================================
  // 🌐 3. INTERNET ENGINE RETRIEVAL PIPELINE (TAVILY API LINK)
  // ============================================================================
  const latestMessage = cleanMessages[cleanMessages.length - 1];
  let isSearchRequested = false;

  if (latestMessage && latestMessage.role === "user" && latestMessage.content.startsWith("[Web Search Active]")) {
    isSearchRequested = true;
    // Extract pure semantic string query out of the front-end formatting flag
    latestMessage.content = latestMessage.content.replace("[Web Search Active] ", "").trim();
  }

  if (isSearchRequested && tavilyApiKey) {
    try {
      console.log(`🌐 [BANANA CORE] Querying live search index matrices for: "${latestMessage.content}"`);
      
      const searchResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: latestMessage.content,
          search_depth: "basic",
          max_results: 3
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData && Array.isArray(searchData.results) && searchData.results.length > 0) {
          const contextSnippets = searchData.results
            .map((r: any) => `Source Document: ${r.title || 'Untitled'} (${r.url || 'No URL'})\nExtract: ${r.content || ''}`)
            .join('\n\n');

          // Mutate target user content string with newly compiled reference contexts
          latestMessage.content = `[LIVE WEB SEARCH DATA CAPTURED]\n${contextSnippets}\n\nUsing the live search details above to provide an accurate, up-to-date answer for the year 2026, address the following user query:\nUser Question: ${latestMessage.content}`;
        }
      }
    } catch (searchError: any) {
      console.error("⚠️ [BANANA CORE] Web Search index extraction timeline degraded, continuing without context:", searchError?.message || searchError);
    }
  }

  // ============================================================================
  // 4. CHAT ROUTING TARGET RESOLUTION DICTIONARY
  // ============================================================================
  let targetOllamaModel = "";
  let forceCloudFallback = false;

  switch (selectedModel) {
    case "Pro-Nana":
      targetOllamaModel = "llama3.1";
      break;
    case "Logic-Nana":
      targetOllamaModel = "deepseek-r1";
      break;
    case "Code-Nana":
      targetOllamaModel = "qwen2.5-coder";
      break;
    case "Instant-Nana":
    default:
      forceCloudFallback = true;
      break;
  }

  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...cleanMessages
  ];

  let payloadSize = 0;
  try {
    payloadSize = Buffer.byteLength(JSON.stringify(messages), "utf8");
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

  // ============================================================================
  // ⚙️ 5. LOCAL HARDWARE CLUSTER ENGINE RETRIEVAL PIPELINE (OLLAMA)
  // ============================================================================
  if (!forceCloudFallback && targetOllamaModel) {
    try {
      const response = await fetch(
        `${OLLAMA_TARGET}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: targetOllamaModel,
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
        console.log(`[BANANA] Local engine ${targetOllamaModel} connection window timed out. Executing failover...`);
      } else {
        console.log(`[BANANA] Local core ${targetOllamaModel} offline/unreachable. Executing failover...`);
      }
    }
  }

  // ============================================================================
  // ☁️ 6. CLOUD FALLBACK BACKUP PIPELINE (GROQ CLOUD GATEWAY)
  // ============================================================================
  try {
    if (!apiKey) {
      throw new Error("Missing Groq API key configuration.");
    }

    // Capture solely the last question/answer sequence exchange loop
    const lastTwoMessages = cleanMessages.slice(-2); 

    // Compute updated structural memory text content incrementally
    const updatedSummary = await updateIncrementalSummary(existingSummary, lastTwoMessages, apiKey);
    const latestUserExchange = cleanMessages[cleanMessages.length - 1];

    const optimizedCloudMessages = [
      { 
        role: "system", 
        content: `${systemPrompt}\n\n[CONVERSATION SUMMARY CONTEXT LOGS]: ${updatedSummary}` 
      },
      latestUserExchange
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
      throw new Error(`Groq Gateway HTTP status response: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty Groq response payload string generated.");
    }

    return {
      content,
      provider: "groq",
      updatedSummary: updatedSummary 
    };

  } catch (error: any) {
    console.error("[BANANA CORE ERROR] Dynamic Failover Path Broken:", error?.message || error);
    setResponseStatus(event, 500);
    return {
      content: "Connection Error: BANANA Core systems are unreachable. Please check if your computer server is online or your account is valid.",
      provider: "error"
    };
  }
});