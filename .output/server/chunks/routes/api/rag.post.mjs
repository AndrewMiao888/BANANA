import { c as defineEventHandler, r as readBody, u as useRuntimeConfig, e as createError } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const rag_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { query } = body;
    const config = useRuntimeConfig();
    const anythingLlmUrl = process.env.ANYTHING_LLM_URL || "http://127.0.0.1:3001/api/v1";
    const anythingLlmKey = process.env.ANYTHING_LLM_KEY;
    if (!anythingLlmKey) {
      throw createError({ statusCode: 500, statusMessage: "Missing ANYTHING_LLM_KEY in .env" });
    }
    const ragResponse = await $fetch(`${anythingLlmUrl}/workspace/banana-ai/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${anythingLlmKey}`,
        "Content-Type": "application/json"
      },
      body: {
        message: query,
        mode: "query"
      }
    });
    return {
      success: true,
      text: ragResponse.textResponse,
      sources: ragResponse.sources || []
    };
  } catch (error) {
    return {
      success: false,
      text: "\u26A0\uFE0F AnythingLLM Connection Failed.",
      error: error.message
    };
  }
});

export { rag_post as default };
//# sourceMappingURL=rag.post.mjs.map
