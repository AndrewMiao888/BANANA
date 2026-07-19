// server/api/analyze-vision.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt, imageBase64 } = body // imageBase64 should be format: data:image/jpeg;base64,...

  // Extract base64 clean data string for Ollama layout array
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  // 1. TRY LOCAL VISION FIRST
  try {
    const ollamaVisionResponse = await $fetch<any>('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      body: {
        model: 'llava', // Standard local vision model
        prompt: prompt,
        images: [cleanBase64],
        stream: false
      },
      timeout: 4000 // Slightly longer timeout given image processing sizes
    })

    return {
      success: true,
      source: 'local-llava',
      analysis: ollamaVisionResponse.response
    }

  } catch (localError) {
    console.warn('Local Vision offline. Falling back to Groq Multimodal Pipeline...')

    const config = useRuntimeConfig()
    const apiKey = config.groqApiKey

    if (!apiKey) {
      throw createError({ statusCode: 503, statusMessage: 'Missing Groq API Key.' })
    }

    // 2. CLOUD VISION FALLBACK (Groq Llama-3.2 Vision)
    try {
      const groqVisionResponse = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'llama-3.2-11b-vision-preview', 
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageBase64 } } // Groq handles data URIs cleanly
              ]
            }
          ]
        }
      })

      return {
        success: true,
        source: 'groq-vision',
        analysis: groqVisionResponse.choices[0].message.content
      }

    } catch (cloudError: any) {
      throw createError({
        statusCode: cloudError.statusCode || 500,
        statusMessage: `Cloud Vision Analysis Failed: ${cloudError.message}`
      })
    }
  }
})