// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, selectedModelId } = body

    if (!messages || !Array.isArray(messages)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Conversation history matrix is missing or malformed.'
      })
    }

    // Match the target configuration or drop back to Instant-NANA core baseline
    const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]

    // Inject system persona parameters directly into structural execution path
    const fullyContextualMessages = [
      { role: 'system', content: systemPrompts.chatAgent },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    // ─── PIPELINE 1: ATTEMPT LOCAL MACHINE COMPUTATION ───────────────────
    if (modelConfig.provider === 'local') {
      try {
        const ollamaResponse = await $fetch<any>('http://127.0.0.1:11434/api/chat', {
          method: 'POST',
          body: {
            model: modelConfig.id,
            messages: fullyContextualMessages,
            stream: false
          },
          timeout: 4000 // 4 second connection breaker limit for quick re-routing
        })

        if (ollamaResponse?.message) {
          return {
            success: true,
            source: `${modelConfig.name} (Local Hardware)`,
            message: {
              role: 'assistant',
              content: ollamaResponse.message.content
            }
          }
        }
      } catch (localError) {
        console.warn(`Local channel [${modelConfig.name}] timed out or offline. Shunting traffic to Cloud Core...`)
      }
    }

    // ─── PIPELINE 2: EMERGENCY/DEFAULT CLOUD FALLBACK (GROQ) ───────────
    const config = useRuntimeConfig()
    const apiKey = config.groqApiKey

    if (!apiKey) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Cloud Framework Failure: Runtime verification token missing.'
      })
    }

    // Route to the specifically chosen Cloud engine, or use the high-availability backup
    const targetCloudModel = modelConfig.provider === 'groq' ? modelConfig.id : 'llama3-8b-8192'

    try {
      const groqResponse = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: targetCloudModel,
          messages: fullyContextualMessages
        }
      })

      if (groqResponse?.choices?.[0]?.message) {
        return {
          success: true,
          source: modelConfig.provider === 'groq' 
            ? `${modelConfig.name} (Direct Cloud)` 
            : 'Instant-NANA (Cloud Fallback Overdrive)',
          message: {
            role: 'assistant',
            content: groqResponse.choices[0].message.content
          }
        }
      }
      
      throw new Error('Upstream buffer empty.')

    } catch (cloudError: any) {
      throw createError({
        statusCode: cloudError.statusCode || 500,
        statusMessage: `All computational networks exhausted: ${cloudError.message}`
      })
    }

  } catch (globalError: any) {
    throw createError({
      statusCode: globalError.statusCode || 500,
      statusMessage: `Core Orchestrator Interrupted: ${globalError.statusMessage || globalError.message}`
    })
  }
})