// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

// 🎛️ CONFIGURATION PARAMETER: Your permanent, unlimited Tailscale Funnel gateway
const OLLAMA_TAILSCALE_ENDPOINT = 'https://xps9530-haydenk.tailb68230.ts.net/api/chat'

async function executeWebSearchQuery(query: string): Promise<string> {
  try {
    const searchData = await $fetch<any>(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    
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
    // 🧠 FIXED: Pulled summaryContext cleanly from your incoming message body payload
    const { messages, selectedModelId, summaryContext } = body

    if (!messages || !Array.isArray(messages)) {
      throw createError({ statusCode: 400, statusMessage: 'Malformed text history structure.' })
    }

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]
    const incomingUserPrompt = messages[messages.length - 1]?.content || ''

    // 🧠 INJECT MEMORY KNOWLEDGE BASE AS A SYSTEM DIRECTIVE HIDING IT FROM USER VIEWS
    const comprehensiveSystemPrompt = `${systemPrompts.chatAgent}\n\n[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:\n${summaryContext || 'No historical data compiled.'}`

    const baseContextMessages = [
      { role: 'system', content: comprehensiveSystemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    let finalResponseText = ''
    let activeExecutionSource = `${modelConfig.name} (Tailscale Node)`

    // ─── STAGE 1: COMPUTE STRATEGY VIA TAILSCALE FUNNEL ──────────────────
    if (modelConfig.provider === 'local') {
      try {
        const ollamaRes = await $fetch<any>(OLLAMA_TAILSCALE_ENDPOINT, {
          method: 'POST',
          body: { model: modelConfig.id, messages: baseContextMessages, stream: false },
          timeout: 7000 // 7s threshold to allow cloud to tunnel smoothly down to local hardware
        })
        finalResponseText = ollamaRes?.message?.content || ''
      } catch (localErr) {
        console.warn('Tailscale Funnel node busy or adjusting routing rules. Shunting parameters over to Cloud Core...')
      }
    }

    // Direct Cloud Route Fallback Execution Block
    if (!finalResponseText) {
      const config = useRuntimeConfig()
      const targetCloudModel = modelConfig.provider === 'groq' ? modelConfig.id : 'llama3-8b-8192'
      activeExecutionSource = modelConfig.provider === 'groq' ? `${modelConfig.name} (Cloud Target)` : 'Instant-NANA (Cloud Fallback Overdrive)'

      const groqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        body: { model: targetCloudModel, messages: baseContextMessages }
      })
      finalResponseText = groqRes?.choices?.[0]?.message?.content || ''
    }

    // ─── STAGE 2: AUTONOMOUS AUTOMATED SEARCH TELEMETRY ──────────────
    const searchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "well, i don't know the answer"
    ]

    const requiresWebTelemetry = searchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    if (requiresWebTelemetry) {
      console.log(`🌐 Mesh Redirect: Model hit validation limits. Initializing live network search parameters...`)
      
      const networkTelemetryData = await executeWebSearchQuery(incomingUserPrompt)
      
      const patchedSearchContext = [
        { role: 'system', content: `${comprehensiveSystemPrompt}\n\n[LIVE SEARCH TELEMETRY DATA]:\n${networkTelemetryData}\n\nIntegrate this data payload directly into your response parameters.` },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ]

      const config = useRuntimeConfig()
      const searchGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        body: { model: 'llama3-8b-8192', messages: patchedSearchContext }
      })

      finalResponseText = searchGroqRes?.choices?.[0]?.message?.content || finalResponseText
      activeExecutionSource += ' + Autonomous Web Search'
    }

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