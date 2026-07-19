// server/api/generate.post.ts
import { systemPrompts } from '~~/src/agents'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt } = body

  const payloadMessages = [
    { role: 'system', content: systemPrompts.codeAgent },
    { role: 'user', content: prompt }
  ]

  // 1. TRY LOCAL OLLAMA FIRST
  try {
    const ollamaResponse = await $fetch<any>('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      body: {
        model: 'llama3',
        messages: payloadMessages,
        stream: false
      },
      timeout: 2000
    })

    return {
      success: true,
      source: 'local-ollama',
      text: ollamaResponse.message.content
    }

  } catch (localError) {
    console.warn('Ollama offline. Falling back to Groq Cloud Generation...')

    const config = useRuntimeConfig()
    const apiKey = config.groqApiKey

    if (!apiKey) {
      throw createError({ statusCode: 503, statusMessage: 'Missing Groq API Key.' })
    }

    // 2. CLOUD FALLBACK
    try {
      const groqResponse = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'llama3-70b-8192', // Uses the larger model for heavy reasoning generation tasks
          messages: payloadMessages
        }
      })

      return {
        success: true,
        source: 'groq-cloud',
        text: groqResponse.choices[0].message.content
      }

    } catch (cloudError: any) {
      throw createError({
        statusCode: cloudError.statusCode || 500,
        statusMessage: `Cloud Generation Failed: ${cloudError.message}`
      })
    }
  }
})