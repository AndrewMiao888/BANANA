// server/api/chat.post.ts
import { systemPrompts } from '~~/src/agents'
import { AVAILABLE_MODELS } from '~~/src/models'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, selectedModelId, summaryContext } = body
    const config = useRuntimeConfig()

    // ─── 1. PAYLOAD ERROR RECOVERY SHIELD ─────────────────────────────────
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

    // ─── 2. STAGE DATA CLEANING PASS (PREVENTS GROQ 400 BAD REQUESTS) ─────
    const cleanHistory = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).trim()
      }))

    // ─── 3. SYSTEM PROMPT & SUMMARY DIRECTIVE EVALUATION ──────────────────
    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE")

    // 1. Resolve active model identifier (defaults to Enterprise-NANA if not provided)
const currentModelName = selectedModelId || 'Enterprise-NANA'

// 2. Build the system prompt with explicit identity enforcement
const comprehensiveSystemPrompt = isSummaryRequest 
  ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
  : `System Identity: You are BANANA Intelligence running on the model "${currentModelName}". If asked which model, engine, or AI agent you are, state truthfully that you are running on ${currentModelName}.\n\n${systemPrompts.chatAgent}\n\n[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:\n${summaryContext || 'No historical data compiled.'}`

    const baseContextMessages = [
      { role: 'system', content: comprehensiveSystemPrompt.trim() },
      ...cleanHistory
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── STAGE 1: LOCAL HARDWARE EXECUTION PROBING ────────────────────────
    if (modelConfig && modelConfig.provider === 'local') {
      const targetEndpoint = `${config.homeOllamaUrl || 'https://xps9530-haydenk.tailb68230.ts.net'}/api/chat`
      
      try {
        const ollamaRes = await $fetch<any>(targetEndpoint, {
          method: 'POST',
          body: { model: modelConfig.id, messages: baseContextMessages, stream: false },
          timeout: 2000 // ⚡ Tight threshold to skip fast if local computer drops out
        })
        finalResponseText = ollamaRes?.message?.content || ''
        activeExecutionSource = `${modelConfig.name} (Tailscale Local Mesh)`
      } catch (localErr) {
        // Quiet switchover sequence triggered without pushing errors up to UI console
        console.warn('Local node failed or unreachable. Auto-switching to Groq Overdrive routing...')
      }
    }

    // ─── STAGE 2: AUTO SWITCH CLOUD CORE OVERDRIVE (IF LOCAL CRASHED) ─────
    if (!finalResponseText) {
      const apiKey = config.groqApiKey
      if (!apiKey) {
        return {
          success: true,
          source: 'System Safe Mode Router',
          message: { 
            role: 'assistant', 
            content: '⚠️ **Deployment Sync Alert**: Missing `GROQ_API_KEY` in environment config parameters.' 
          }
        }
      }

      // 🎯 FORCE FASTEST LATEST STRINGS: Routes directly to active Llama 4 Scout or GPT-OSS
      const isTargetGroq = modelConfig && modelConfig.provider === 'groq' && !modelConfig.id.includes('node')
      const targetCloudModel = isTargetGroq ? modelConfig.id : 'meta-llama/llama-4-scout-17b-16e-instruct'
      
      activeExecutionSource = isTargetGroq 
        ? `${modelConfig.name} (Cloud Target)` 
        : 'Instant-NANA (Cloud Fallback Overdrive: Llama Fast-Route)'

      try {
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
      } catch (groqPrimaryErr) {
        // Hard fallback to safe alternative cloud model if Llama 4 experiences peak tier limit caps
        const fallbackGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: { 
            model: 'openai/gpt-oss-20b', 
            messages: baseContextMessages
          }
        })
        finalResponseText = fallbackGroqRes?.choices?.[0]?.message?.content || ''
        activeExecutionSource = 'Instant-NANA (Secondary Cloud Safe-Route Fallback)'
      }
    }

    // ─── STAGE 3: AUTONOMOUS REAL-TIME WEB SEARCH MATRIX ──────────────────
    const userExplicitlyTriggered = incomingUserPrompt.toLowerCase().trim().startsWith('/search')
    
    const implicitSearchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "well, i don't know the answer", "latest weather", "currently in tokyo"
    ]
    const aiWantsSearchTriggered = implicitSearchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    // Bypass search step if it's an internal summary pass
    if ((userExplicitlyTriggered || aiWantsSearchTriggered) && !isSummaryRequest) {
      try {
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
            model: 'meta-llama/llama-4-scout-17b-16e-instruct', 
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
      source: 'Internal Error Diagnostics Recovery Mode',
      message: { 
        role: 'assistant', 
        content: `🔧 **Pipeline Recovery Confirmation**: Fail-safe operational path locked down.\n\n* **Status**: Stabilized\n* **Log Trace**: ${err.message || 'Validation standard reset complete'}`
      }
    }
  }
})
