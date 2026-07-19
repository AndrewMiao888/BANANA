// server/api/generate.post.ts
import { systemPrompts } from '~~/src/agents'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { prompt } = body

    if (!prompt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Operational script prompt is missing.'
      })
    }

    const structurePayload = [
      { role: 'system', content: systemPrompts.codeAgent },
      { role: 'user', content: prompt }
    ]

    // 1. TRY LOCAL COMPUTER SYNTAX ENGINE (Codestral)
    try {
      const ollamaGenerate = await $fetch<any>('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        body: {
          model: 'codestral',
          messages: structurePayload,
          stream: false
        },
        timeout: 4000 // 4 second structural compute breaker limit
      })

      return {
        success: true,
        source: 'Local-NANA (Generate)',
        text: ollamaGenerate.message.content
      }

    } catch (localError) {
      console.warn('Local syntax engine offline. Routing data stream packet to Groq Cloud Core...')

      // 2. RUN CLOUD FALLBACK GATEWAY (Groq Production Engine)
      const config = useRuntimeConfig()
      const apiKey = config.groqApiKey

      if (!apiKey) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Cloud Authorization Error: Missing cloud runtime config keys.'
        })
      }

      const groqGenerate = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'llama3-8b-8192', // Route directly to fast cloud infrastructure
          messages: structurePayload
        }
      })

      return {
        success: true,
        source: 'Instant-NANA (Cloud Generate)',
        text: groqGenerate.choices[0].message.content
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: `Generation Matrix Blocked: ${error.statusMessage || error.message}`
    })
  }
})