export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { query } = body
    const config = useRuntimeConfig()
    
    // Ensure you have these variables in your .env file
    const anythingLlmUrl = process.env.ANYTHING_LLM_URL || 'http://127.0.0.1:3001/api/v1'
    const anythingLlmKey = process.env.ANYTHING_LLM_KEY

    if (!anythingLlmKey) {
      throw createError({ statusCode: 500, statusMessage: 'Missing ANYTHING_LLM_KEY in .env' })
    }

    const ragResponse = await $fetch<any>(`${anythingLlmUrl}/workspace/banana-ai/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anythingLlmKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        message: query,
        mode: 'query'
      }
    })

    return {
      success: true,
      text: ragResponse.textResponse,
      sources: ragResponse.sources || []
    }
  } catch (error: any) {
    return {
      success: false,
      text: '⚠️ AnythingLLM Connection Failed.',
      error: error.message
    }
  }
})