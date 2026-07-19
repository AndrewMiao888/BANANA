// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, selectedModelId } = body

  // Find configuration or fallback to our default Cloud engine
  const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]

  const fullyContextualMessages = [
    { role: 'system', content: systemPrompts.chatAgent },
    ...messages
  ]

  // If user picks a local -NANA model, try local machine routing first
  if (modelConfig.provider === 'local') {
    try {
      const ollamaResponse = await $fetch<any>('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        body: {
          model: modelConfig.id,
          messages: fullyContextualMessages,
          stream: false
        },
        timeout: 4000
      })
      return { success: true, source: 'local-computer', message: ollamaResponse.message }
    } catch (err) {
      console.warn(`Local model [${modelConfig.name}] unreachable. Dropping back to cloud processing...`)
    }
  }

  // EXCLUSIVE CLOUD ENGINE BACKUP (Instant-NANA via Groq)
  const config = useRuntimeConfig()
  const apiKey = config.groqApiKey

  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Cloud engine offline: Missing runtime authorization keys.' })
  }

  try {
    const groqResponse = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model: 'llama3-8b-8192', // Always use the instant baseline for cloud requests
        messages: fullyContextualMessages
      }
    })

    return { success: true, source: 'groq-cloud', message: groqResponse.choices[0].message }
  } catch (cloudError: any) {
    throw createError({ statusCode: 500, statusMessage: `All endpoints exhausted: ${cloudError.message}` })
  }
})