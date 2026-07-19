// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

// Simple server-side search framework to retrieve missing background context
async function executeWebSearchQuery(query: string): Promise<string> {
  try {
    const searchData = await $fetch<any>(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    
    // Extract readable context blocks out of raw web segments securely
    const snippets: string[] = []
    const matchReg = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    let match;
    while ((match = matchReg.exec(searchData)) !== null && snippets.length < 4) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim())
    }
    
    return snippets.join('\n\n')
  } catch (err) {
    console.error('Search Engine Tunnel dropped packet query:', err)
    return 'No additional network telemetry found.'
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, selectedModelId } = body

    if (!messages || !Array.isArray(messages)) {
      throw createError({ statusCode: 400, statusMessage: 'Malformed text array.' })
    }

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]
    let incomingUserPrompt = messages[messages.length - 1]?.content || ''

    const baseContextMessages = [
      { role: 'system', content: systemPrompts.chatAgent },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    let finalResponseText = ''
    let activeExecutionSource = `${modelConfig.name} (Local Hardware)`

    // ─── STAGE 1: COMPUTE STRATEGY SELECTION ─────────────────────────────
    if (modelConfig.provider === 'local') {
      try {
        const ollamaRes = await $fetch<any>('http://127.0.0.1:11434/api/chat', {
          method: 'POST',
          body: { model: modelConfig.id, messages: baseContextMessages, stream: false },
          timeout: 4000
        })
        finalResponseText = ollamaRes?.message?.content || ''
      } catch (localErr) {
        console.warn('Local engine offline, dropping parameters over to Cloud Framework...')
      }
    }

    // If local was offline or empty, resolve directly via Groq baseline
    if (!finalResponseText) {
      const config = useRuntimeConfig()
      const targetCloudModel = modelConfig.provider === 'groq' ? modelConfig.id : 'llama3-8b-8192'
      activeExecutionSource = modelConfig.provider === 'groq' ? `${modelConfig.name} (Cloud)` : 'Instant-NANA (Cloud Fallback)'

      const groqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        body: { model: targetCloudModel, messages: baseContextMessages }
      })
      finalResponseText = groqRes?.choices?.[0]?.message?.content || ''
    }

    // ─── STAGE 2: AUTONOMOUS REAL-TIME SEARCH ENGINE CHECK ──────────────
    const searchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "well, i don't know the answer"
    ]

    const requiresWebTelemetry = searchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    if (requiresWebTelemetry) {
      console.log(`🌐 Autonomous routing: Model hit verification boundaries. Initializing network data telemetry search...`)
      
      // Auto-extract query strings or pass the active conversation statement directly
      const networkTelemetryData = await executeWebSearchQuery(incomingUserPrompt)
      
      // Inject network updates to build a revised contextual logic path
      const patchedSearchContext = [
        { role: 'system', content: `${systemPrompts.chatAgent}\n\n[LIVE SEARCH TELEMETRY DATA]:\n${networkTelemetryData}\n\nIntegrate this data payload directly into your response parameters.` },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ]

      const config = useRuntimeConfig()
      const searchGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        body: { model: 'llama3-8b-8192', messages: patchedSearchContext }
      })

      finalResponseText = searchGroqRes?.choices?.[0]?.message?.content || finalResponseText
      activeExecutionSource += ' + Autonomous Web Search Network'
    }

    // ─── STAGE 3: RETURN FINAL RESPONSE DATA ─────────────────────────────
    return {
      success: true,
      source: activeExecutionSource,
      message: { role: 'assistant', content: finalResponseText }
    }

  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Orchestrator failed to allocate model matrices: ${err.message}`
    })
  }
})