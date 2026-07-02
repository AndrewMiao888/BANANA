import { defineEventHandler, readBody } from 'h3';
import { pipeline, env } from '@huggingface/transformers';

// Configuration: Allow downloading fresh weights from Hugging Face Hub if not cached locally
env.allowLocalModels = false;

let visionPipeline: any = null;

/**
 * Singleton factory to ensure the AI model weights are only loaded 
 * into your computer's RAM memory once.
 */
async function getVisionPipeline() {
  if (!visionPipeline) {
    console.log("\n==================================================");
    console.log("⚡ BANANA AI CORE: Initializing Vision Pipeline...");
    console.log("📦 Model: Xenova/vit-gpt2-image-captioning");
    console.log("🔄 If this is your first run, downloading weights now...");
    console.log("==================================================\n");
    
    // Loads the lightweight image captioning model engine
    visionPipeline = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
    
    console.log("\n✅ BANANA AI CORE: Brain weights successfully loaded into memory!");
  }
  return visionPipeline;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { imageBase64 } = body;

    if (!imageBase64) {
      return { 
        success: false, 
        error: "Missing image data payload. Please provide a base64 encoded image string." 
      };
    }

    // Clean up base64 prefixes if passed from a standard HTML canvas or file reader input
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Convert the raw text data back into a valid binary buffer that the AI engine can look at
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    // Initialize/Get our local AI model
    const pfn = await getVisionPipeline();

    console.log("🧠 BANANA AI CORE: Processing local image buffer analysis matrices...");
    const startTime = Date.now();

    // Pass the image buffer straight to your computer's CPU/GPU processing threads
    const result = await pfn(imageBuffer);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ BANANA AI CORE: Generation complete in ${duration}s! Result: "${result[0]?.generated_text}"\n`);

    return {
      success: true,
      engine: 'BANANA-Vision-Local-Matrix',
      analysis: result[0]?.generated_text || "Image analyzed, but no valid token tags were extracted.",
      computationTimeSeconds: parseFloat(duration),
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error("❌ BANANA AI PIPELINE ERROR:", error);
    return { 
      success: false, 
      error: 'Vision processing engine pipeline failure.', 
      details: error.message 
    };
  }
});