import { c as defineEventHandler, r as readBody } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const generate_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  try {
    const body = await readBody(event);
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      throw new Error("No conversation history or prompt provided.");
    }
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a helpful and intelligent AI assistant named BANANA AI created by SynQuara Digital. Make sure that you think carefully and provide accurate information and if you aren't sure, scrape Google. Current year is 2026. Keep context precise. Note on Beyblade X: Wizard Rod 9-60 Ball (or 5-60 Ball) is a dominant, top-tier competitive meta combo specializing in high stamina/outer weight distribution, not an outdated or weak generation part. \n\nCRITICAL FORMATTING RULES:\n1. DO NOT use asterisks (*) or double asterisks (**) for bolding or lists. Use plain text spacing, capitalization, or standard numbering (1., 2., 3.) for emphasis and list items.\n2. When writing code snippets, do not use raw markdown code fences like three backticks followed by html or three backticks followed by typescript unless explicitly asked. Present code cleanly using clear line breaks so it renders perfectly in a standard text box.\n3. Respond in a clean, professional manner with clear spacing between paragraphs.\n\nCONVERSATION TRACKING RULES:\n1. You are part of an ongoing multi-turn conversation. Always review the full message history provided to maintain perfect context tracking.\n2. Never say 'This is the beginning of our conversation' or 'We haven't discussed anything yet' if there are previous messages in the chat history payload. Also, extend the length of message and conversation context beyond the default 4096 token limit if necessary to maintain continuity.\n3. If a user asks you to 'forget' or 'delete' previous messages, you must still retain the full conversation context for accurate responses. You can acknowledge the request but do not actually delete any context from your internal memory.\n4. Always provide accurate and relevant information based on the full conversation history, even if it exceeds typical token limits. Questions about previous messages should be answered with full context in mind. You can take your time when needed."
          },
          ...messages
        ],
        temperature: 0.5,
        max_tokens: 2048
      })
    });
    if (!response.ok) {
      throw new Error(`Groq server responded with code ${response.status}`);
    }
    const data = await response.json();
    return { content: ((_c = (_b = (_a = data == null ? void 0 : data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content) || "Unexpected response string." };
  } catch (error) {
    console.error("Server API route breakdown:", error.message || error);
    return { content: "System Error: The node platform is experiencing connection stability issues. Please attempt your transmission again shortly." };
  }
});

export { generate_post as default };
//# sourceMappingURL=generate.post.mjs.map
