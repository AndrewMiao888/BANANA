import { c as defineEventHandler, r as readBody } from '../../_/nitro.mjs';
import { env, pipeline } from '@huggingface/transformers';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

env.allowLocalModels = false;
let visionPipeline = null;
async function getVisionPipeline() {
  if (!visionPipeline) {
    console.log("\n==================================================");
    console.log("\u26A1 BANANA AI CORE: Initializing Vision Pipeline...");
    console.log("\u{1F4E6} Model: Xenova/vit-gpt2-image-captioning");
    console.log("\u{1F504} If this is your first run, downloading weights now...");
    console.log("==================================================\n");
    visionPipeline = await pipeline("image-to-text", "Xenova/vit-gpt2-image-captioning");
    console.log("\n\u2705 BANANA AI CORE: Brain weights successfully loaded into memory!");
  }
  return visionPipeline;
}
const analyzeVision_post = defineEventHandler(async (event) => {
  var _a, _b;
  try {
    const body = await readBody(event);
    const { imageBase64 } = body;
    if (!imageBase64) {
      return {
        success: false,
        error: "Missing image data payload. Please provide a base64 encoded image string."
      };
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const pfn = await getVisionPipeline();
    console.log("\u{1F9E0} BANANA AI CORE: Processing local image buffer analysis matrices...");
    const startTime = Date.now();
    const result = await pfn(imageBuffer);
    const duration = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log(`\u2728 BANANA AI CORE: Generation complete in ${duration}s! Result: "${(_a = result[0]) == null ? void 0 : _a.generated_text}"
`);
    return {
      success: true,
      engine: "BANANA-Vision-Local-Matrix",
      analysis: ((_b = result[0]) == null ? void 0 : _b.generated_text) || "Image analyzed, but no valid token tags were extracted.",
      computationTimeSeconds: parseFloat(duration),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    console.error("\u274C BANANA AI PIPELINE ERROR:", error);
    return {
      success: false,
      error: "Vision processing engine pipeline failure.",
      details: error.message
    };
  }
});

export { analyzeVision_post as default };
//# sourceMappingURL=analyze-vision.post.mjs.map
