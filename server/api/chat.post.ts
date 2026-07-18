import { defineEventHandler, readBody, createError, setResponseHeader } from 'h3'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  messages?: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
}

export default defineEventHandler(async (event) => {
  // 1. Set standard secure headers up front
  setResponseHeader(event, 'Content-Type', 'application/json')

  // 2. Safely resolve config to fix error #2 (Variable Context Conflict)
  const config = useRuntimeConfig(event)
  
  // Safely extract string variables to fix error #4 (Environment trim failures)
  const rawOllamaUrl = config?.public?.HOME_OLLAMA_URL || process.env.HOME_OLLAMA_URL || ''
  const rawGroqKey = config?.GROQ_API_KEY || process.env.GROQ_API_KEY || ''
  
  const localOllamaUrl = typeof rawOllamaUrl === 'string' ? rawOllamaUrl.trim() : ''
  const groqApiKey = typeof rawGroqKey === 'string' ? rawGroqKey.trim() : ''

  // 3. Safely parse incoming body to fix error #3 (Stream consumption exhaustion)
  let body: ChatRequestBody = {}
  try {
    const parsedBody = await readBody<any>(event)
    if (parsedBody) {
      body = parsedBody
    }
  } catch (e) {
    // If body was already consumed upstream, we fall back to an empty object instead of crashing
    body = {}
  }

  // Fallback to empty array if messages are missing
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
  
  if (messages.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Messages array cannot be empty.'
    })
  }

  const targetModel = body.model || 'llama3'
  const targetTemperature = typeof body.temperature === 'number' ? body.temperature : 0.7
  const targetMaxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : 2048

  // --- PHASE 1: TRY LOCAL OLLAMA HARD DRIVE ROUTE ---
  if (localOllamaUrl) {
    try {
      const baseSanitizedUrl = localOllamaUrl.replace(/\/$/, '')
      const ollamaChatUrl = `${baseSanitizedUrl}/api/chat`

      // Using "unknown" first, then mapping safely to handle error #1 (Type Instantiation Mismatch)
      const ollamaRawResult = await $fetch<unknown>(ollamaChatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          model: targetModel,
          messages: messages,
          options: {
            temperature: targetTemperature,
            num_predict: targetMaxTokens
          },
          stream: false
        },
        // 5 second timeout to cleanly handle error #5 (Network Abort / Hard drive wakeup lag)
        timeout: 5000 
      })

      const data = ollamaRawResult as any
      if (data && data.message && data.message.content) {
        return {
          success: true,
          source: 'local-ollama',
          model: data.model || targetModel,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: String(data.message.content)
              },
              finish_reason: 'stop'
            }
          ]
        }
      }
    } catch (ollamaException) {
      // Local node is off, asleep, or timed out. Log it and gracefully slide into Groq!
      console.warn('[Hybrid Shield]: Local engine unavailable, shifting to Groq backup cloud.')
    }
  }

  // --- PHASE 2: FALLBACK TO GROQ CLOUD ROUTE ---
  if (!groqApiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Configuration Failure: Local machine is offline, and Groq Cloud API Key is missing.'
    })
  }

  try {
    const groqRawResult = await $fetch<unknown>('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: 'llama3-8b-8192', // Groq ultra-fast fallback model
        messages: messages,
        temperature: targetTemperature,
        max_tokens: targetMaxTokens,
        stream: false
      },
      timeout: 10000
    })

    const data = groqRawResult as any
    if (data && data.choices && data.choices[0]?.message?.content) {
      return {
        success: true,
        source: 'groq-cloud',
        model: data.model || 'llama3-8b-8192',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: String(data.choices[0].message.content)
            },
            finish_reason: data.choices[0].finish_reason || 'stop'
          }
        ]
      }
    }
  } catch (groqException: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `Groq Cloud Execution Failure: ${groqException.message || 'Unknown network crash'}`
    })
  }

  // Complete failure fallback safeguard
  throw createError({
    statusCode: 500,
    statusMessage: 'Critical System Error: Both storage nodes and cloud fallback clusters failed to return data.'
  })
})