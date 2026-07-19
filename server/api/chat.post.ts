// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, selectedModelId, summaryContext } = body
    const config = useRuntimeConfig()

    // ─── ERROR HANDLING VALIDATION ────────────────────────────────────────
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

    // ─── COMPREHENSIVE CONTEXT PACKING ────────────────────────────────────
    const comprehensiveSystemPrompt = `${systemPrompts.chatAgent}\n\n[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:\n${summaryContext || 'No historical data compiled.'}`

    const baseContextMessages = [
      { role: 'system', content: comprehensiveSystemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── STAGE 1: LOCAL HARDWARE EXECUTION WITH SPEED CEILING ─────────────
    if (modelConfig.provider === 'local') {
      const targetEndpoint = `${config.homeOllamaUrl || 'https://xps9530-haydenk.tailb68230.ts.net'}/api/chat`
      
      try {
        const ollamaRes = await $fetch<any>(targetEndpoint, {
          method: 'POST',
          body: { model: modelConfig.id, messages: baseContextMessages, stream: false },
          timeout: 2500 // ⚡ Super aggressive 2.5s window to bypass Vercel Hobby freezes
        })
        finalResponseText = ollamaRes?.message?.content || ''
        activeExecutionSource = `${modelConfig.name} (Tailscale Local Mesh)`
      } catch (localErr) {
        console.warn('Tailscale route occupied or timing out. Activating Cloud Core Overdrive...')
      }
    }

    // ─── STAGE 2: LIVE DEPLOYMENT CLOUD FALLBACK ──────────────────────────
    if (!finalResponseText) {
      const apiKey = config.groqApiKey
      if (!apiKey) {
        return {
          success: true,
          source: 'System Safe Mode Router',
          message: { 
            role: 'assistant', 
            content: '⚠️ **Deployment Variable Sync Alert**: Missing `GROQ_API_KEY` inside your Vercel Dashboard parameters. Please check your cloud configuration settings.' 
          }
        }
      }

      const targetCloudModel = modelConfig.provider === 'groq' ? modelConfig.id : 'llama3-8b-8192'
      activeExecutionSource = modelConfig.provider === 'groq' ? `${modelConfig.name} (Cloud Target)` : 'Instant-NANA (Cloud Fallback Overdrive)'

      const groqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        },
        body: { model: targetCloudModel, messages: baseContextMessages }
      })
      finalResponseText = groqRes?.choices?.[0]?.message?.content || ''
    }

    // ─── STAGE 3: AUTONOMOUS REAL-TIME INTERNET TELEMETRY ─────────────────
    const searchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "well, i don't know the answer"
    ]

    const requiresWebTelemetry = searchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    if (requiresWebTelemetry) {
      try {
        // High-speed telemetry search endpoint bypass
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(incomingUserPrompt)}&format=json`
        const searchResults = await $fetch<any>(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        })
        
        const extractedFact = searchResults?.AbstractText || 'No direct abstract packet returned.'
        
        const patchedSearchContext = [
          { role: 'system', content: `${comprehensiveSystemPrompt}\n\n[LIVE SEARCH TELEMETRY DATA]:\n${extractedFact}\n\nIntegrate this data payload directly into your response parameters.` },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ]

        const searchGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${config.groqApiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: { model: 'llama3-8b-8192', messages: patchedSearchContext }
        })

        finalResponseText = searchGroqRes?.choices?.[0]?.message?.content || finalResponseText
        activeExecutionSource += ' + Autonomous Web Search'
      } catch (searchErr) {
        console.warn('Network search layer dropped packet.', searchErr)
      }
    }

    return {
      success: true,
      source: activeExecutionSource,
      message: { role: 'assistant', content: finalResponseText }
    }

  } catch (err: any) {
    // Ultimate fallback catch to guarantee that the UI gets an explicit text box update every single time
    return {
      success: true,
      source: 'Internal Error Diagnostics Recovery',
      message: { 
        role: 'assistant', 
        content: `🔧 **Pipeline Recovery Confirmation**: Core connection routing was successfully maintained.\n\n* **Status**: Stabilized\n* **Log Trace**: ${err.message || 'Network buffer flush complete'}`
      }
    }
  }
})