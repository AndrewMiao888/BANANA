import { c as defineEventHandler, r as readBody, e as createError, u as useRuntimeConfig } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const analyzeVision_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { prompt, imageBase64 } = body;
    if (!imageBase64) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request: Image payload matrix is required."
      });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const executionPrompt = prompt || "Analyze this image context.";
    try {
      const ollamaVision = await $fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        body: {
          model: "llava",
          prompt: executionPrompt,
          images: [cleanBase64],
          stream: false
        },
        timeout: 5e3
        // 5 second visual hardware breaker limits
      });
      return {
        success: true,
        source: "Local-NANA (Vision)",
        analysis: ollamaVision.response
      };
    } catch (localError) {
      console.warn("Local visual hardware offline. Moving execution string to Groq Multi-Modal Core...");
      const config = useRuntimeConfig();
      const apiKey = config.groqApiKey;
      if (!apiKey) {
        throw createError({
          statusCode: 503,
          statusMessage: "Cloud Authorization Error: Missing runtime validation tokens."
        });
      }
      const groqVision = await $fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: {
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: executionPrompt },
                { type: "image_url", image_url: { url: imageBase64 } }
                // Groq safely accepts intact Data URIs
              ]
            }
          ]
        }
      });
      return {
        success: true,
        source: "Instant-NANA (Cloud Vision)",
        analysis: groqVision.choices[0].message.content
      };
    }
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: `Vision Pipeline Interrupted: ${error.statusMessage || error.message}`
    });
  }
});

export { analyzeVision_post as default };
//# sourceMappingURL=analyze-vision.post.mjs.map
