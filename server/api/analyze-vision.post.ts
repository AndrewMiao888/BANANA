import { defineEventHandler, readBody } from 'h3';
import { pipeline } from '@xenova/transformers';

let visionPipeline: any = null;

async function getVisionPipeline() {
  if (!visionPipeline) {
    // Initializes a local multimodal model capable of text + image analysis
    visionPipeline = await pipeline('image-to-text', 'Xenova/paligemma-3b-pt-224', {
      quantized: true, // Uses a compressed version so it runs efficiently on standard consumer hardware
    });
  }
  return visionPipeline;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { imageBase64, prompt } = body;

    if (!imageBase64) {
      return { error: 'Missing image data payload.' };
    }

    const pfn = await getVisionPipeline();
    
    // Convert base64 data to an image reference and execute analysis
    const result = await pfn(imageBase64, prompt || "Describe this image in detail.");

    return {
      success: true,
      engine: 'BANANA-Vision-Matrix',
      analysis: result[0]?.generated_text || "Analysis complete, but no output text was generated."
    };
  } catch (error: any) {
    return { error: 'Vision processing pipeline failure.', details: error.message };
  }
});