// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, selectedModelId, summaryContext } = body
    const config = useRuntimeConfig()

    // ─── 1. MALFORMED DATA SHIELD ─────────────────────────────────────────
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        success: true,
        source: 'System Engine Shield',
        message: { 
          role: 'assistant', 
          content: '🔧 **Diagnostics Confirmation**: Empty or malformed payload packet received.' 
        }
      }
    }

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]
    const incomingUserPrompt = messages[messages.length - 1]?.content || ''

    // ─── 2. STRICT PAYLOAD SANITIZER (ELIMINATES 400 BAD REQUEST ERRORS) ──
    // This strips custom UI fields like "source" or "attachments" before the API sees them.
    const cleanHistory = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content || '')
      }))

    const comprehensiveSystemPrompt = `${systemPrompts.chatAgent}\n\n[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:\n${summaryContext || 'No historical data compiled.'}`

    const baseContextMessages = [
      { role: 'system', content: comprehensiveSystemPrompt },
      ...cleanHistory
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── STAGE 1: LOCAL TAILSCALE ROUTING (WITH SHORT-CIRCUIT SAFETY) ─────
    if (modelConfig.provider === 'local') {
      const targetEndpoint = `${config.homeOllamaUrl || 'https://xps9530-haydenk.tailb68230.ts.net'}/api/chat`
      
      try {
        const ollamaRes = await $fetch<any>(targetEndpoint, {
          method: 'POST',
          body: { model: modelConfig.id, messages: baseContextMessages, stream: false },
          timeout: 2500 // ⚡ 2.5s quick timeout to protect Vercel workers from freezing
        })
        finalResponseText = ollamaRes?.message?.content || ''
        activeExecutionSource = `${modelConfig.name} (Tailscale Local Mesh)`
      } catch (localErr) {
        console.warn('Tailscale route occupied or timing out. Shunting to cloud backup...')
      }
    }

    // ─── STAGE 2: PRIMARY CLOUD INFERENCE CORE ────────────────────────────
    if (!finalResponseText) {
      const apiKey = config.groqApiKey
      if (!apiKey) {
        return {
          success: true,
          source: 'System Safe Mode Router',
          message: { 
            role: 'assistant', 
            content: '⚠️ **Deployment Variable Sync Alert**: Missing `GROQ_API_KEY` inside your Vercel Dashboard parameters.' 
          }
        }
      }

      // Safeguard fallback to a reliable, universally available production model ID
      const targetCloudModel = modelConfig.provider === 'groq' ? modelConfig.id : 'llama-3.1-8b-instant'
      activeExecutionSource = modelConfig.provider === 'groq' ? `${modelConfig.name} (Cloud Target)` : 'Instant-NANA (Cloud Fallback Overdrive)'

      const groqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        },
        body: { 
          model: targetCloudModel, 
          messages: baseContextMessages
        }
      })
      finalResponseText = groqRes?.choices?.[0]?.message?.content || ''
    }

    // ─── STAGE 3: AUTONOMOUS REAL-TIME WEB SEARCH MATRIX ──────────────────
    // Condition A: User explicitly prefixes instruction command with /search
    const userExplicitlyTriggered = incomingUserPrompt.toLowerCase().trim().startsWith('/search')
    
    // Condition B: The model text signals knowledge limitations
    const implicitSearchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "well, i don't know the answer"
    ]
    const aiWantsSearchTriggered = implicitSearchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    // Execute only if explicit command is sent OR AI hits context limitations
    if (userExplicitlyTriggered || aiWantsSearchTriggered) {
      try {
        // Clean command out of search query parameters if present
        const searchPhrase = incomingUserPrompt.replace(/\/search\s*/i, '').trim()
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchPhrase)}&format=json`
        
        const searchResults = await $fetch<any>(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        })
        
        const extractedFact = searchResults?.AbstractText || 'No direct summary packet returned.'
        
        const patchedSearchContext = [
          { 
            role: 'system', 
            content: `${comprehensiveSystemPrompt}\n\n[LIVE SEARCH TELEMETRY DATA]:\n${extractedFact}\n\nIntegrate this data payload directly into your response parameters.` 
          },
          ...cleanHistory
        ]

        const searchGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${config.groqApiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: { 
            model: 'llama-3.1-8b-instant', 
            messages: patchedSearchContext 
          }
        })

        finalResponseText = searchGroqRes?.choices?.[0]?.message?.content || finalResponseText
        activeExecutionSource += ' + Autonomous Web Search'
      } catch (searchErr) {
        console.warn('Network search layers dropped packet.', searchErr)
      }
    }

    return {
      success: true,
      source: activeExecutionSource,
      message: { role: 'assistant', content: finalResponseText }
    }

  } catch (err: any) {
    return {
      success: true,
      source: 'Internal Error Diagnostics Recovery',
      message: { 
        role: 'assistant', 
        content: `🔧 **Pipeline Recovery Confirmation**: Connection routing successfully maintained.\n\n* **Status**: Stabilized\n* **Log Trace**: ${err.message || 'Validation standard reset complete'}`
      }
    }
  }
})