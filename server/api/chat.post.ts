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

    const modelConfig = AVAILABLE_MODELS?.find(m => m.id === selectedModelId) || AVAILABLE_MODELS?.[0] || {
      id: selectedModelId || 'Enterprise-NANA',
      name: 'Enterprise-NANA',
      provider: 'groq'
    }
    
    const incomingUserPrompt = messages[messages.length - 1]?.content || ''

    // ─── 2. STAGE DATA CLEANING PASS (PREVENTS GROQ 400 BAD REQUESTS) ─────
    const cleanHistory = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).trim()
      }))

    // ─── 3. SYSTEM PROMPT & SUMMARY DIRECTIVE EVALUATION ──────────────────
    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE")
    const currentModelName = modelConfig.name || selectedModelId || 'Enterprise-NANA'

    const comprehensiveSystemPrompt = isSummaryRequest 
      ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
      : `System Identity: You are BANANA Intelligence running on the model "${currentModelName}". If asked which model, engine, or AI agent you are, state truthfully that you are running on ${currentModelName}.\n\n${systemPrompts?.chatAgent || ''}\n\n[HIDDEN CURRENT CORE KNOWLEDGE PACKET]:\n${summaryContext || 'No historical data compiled.'}`

    const baseContextMessages = [
      { role: 'system', content: comprehensiveSystemPrompt.trim() },
      ...cleanHistory
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── 4. HARD DRIVE LOCAL HARDWARE PROBING (PRIMARY RUNNER) ─────────────
    const localBaseUrl = config.homeOllamaUrl || process.env.HOME_OLLAMA_URL || 'https://xps9530-haydenk.tailb68230.ts.net'
    const targetLocalEndpoint = `${localBaseUrl.replace(/\/$/, '')}/api/chat`
    let isLocalHardwareOnline = false

    // Fast health probe to verify if your hard drive hardware node is live
    try {
      const probeUrl = `${localBaseUrl.replace(/\/$/, '')}/api/tags`
      const healthCheck = await $fetch<any>(probeUrl, { method: 'GET', timeout: 1500 })
      isLocalHardwareOnline = !!healthCheck
    } catch {
      isLocalHardwareOnline = false
    }

    // IF HARD DRIVE HARDWARE IS ONLINE: Run ALL models requested through your hard drive
    if (isLocalHardwareOnline) {
      try {
        const localModelId = modelConfig.id || selectedModelId || 'llama3'
        const ollamaRes = await $fetch<any>(targetLocalEndpoint, {
          method: 'POST',
          body: { model: localModelId, messages: baseContextMessages, stream: false },
          timeout: 15000 
        })
        
        finalResponseText = ollamaRes?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = `${currentModelName} (Hard Drive Local Execution)`
        }
      } catch (localErr) {
        console.warn('Local hard drive execution dropped. Auto-failing over to Groq cloud...')
      }
    }

    // ─── 5. FALLBACK LAYER 1 & 2: GROQ CLOUD OVERDRIVE ────────────────────
    if (!finalResponseText) {
      const apiKey = config.groqApiKey || process.env.GROQ_API_KEY
      
      if (!apiKey) {
        return {
          success: true,
          source: 'System Safe Mode Router',
          message: { 
            role: 'assistant', 
            content: '⚠️ **Deployment Sync Alert**: Hard Drive offline and missing `GROQ_API_KEY` in environment config.' 
          }
        }
      }

      // LEVEL 1 FALLBACK: Strictly force Groq Instant model
      const primaryCloudModel = 'llama-3.1-8b-instant'
      
      try {
        const groqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: { 
            model: primaryCloudModel, 
            messages: baseContextMessages
          }
        })
        finalResponseText = groqRes?.choices?.[0]?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = 'Instant-NANA (Groq Fallback: Instant 8B)'
        }
      } catch (groqInstantErr: any) {
        console.warn('Groq Instant model failed, escalating to Level 2 Fallback (Versatile 70B)...', groqInstantErr?.message)
        
        // LEVEL 2 FALLBACK: Degrade to Groq Versatile model
        try {
          const secondaryCloudModel = 'llama-3.3-70b-versatile'
          const fallbackGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${apiKey}`, 
              'Content-Type': 'application/json' 
            },
            body: { 
              model: secondaryCloudModel, 
              messages: baseContextMessages
            }
          })
          
          finalResponseText = fallbackGroqRes?.choices?.[0]?.message?.content || ''
          if (finalResponseText) {
            activeExecutionSource = 'Instant-NANA (Groq Secondary Fallback: Versatile 70B)'
          }
        } catch (groqVersatileErr: any) {
          console.error('All Groq cloud execution paths failed:', groqVersatileErr?.message)
        }
      }
    }

    // ─── 6. AUTONOMOUS REAL-TIME WEB SEARCH MATRIX ────────────────────────
    const userExplicitlyTriggered = incomingUserPrompt.toLowerCase().trim().startsWith('/search')
    
    const implicitSearchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "well, i don't know the answer", "latest weather", "currently in tokyo"
    ]
    const aiWantsSearchTriggered = implicitSearchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    // Execute web search if triggered by AI choice OR user explicit /search command
    if ((userExplicitlyTriggered || aiWantsSearchTriggered) && !isSummaryRequest && finalResponseText) {
      try {
        const apiKey = config.groqApiKey || process.env.GROQ_API_KEY
        const searchPhrase = incomingUserPrompt.replace(/\/search\s*/i, '').trim()
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchPhrase)}&format=json`
        
        const searchResults = await $fetch<any>(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        })
        
        const extractedFact = searchResults?.AbstractText || searchResults?.RelatedTopics?.[0]?.Text || 'No direct summary packet returned.'
        
        const patchedSearchContext = [
          { 
            role: 'system', 
            content: `${comprehensiveSystemPrompt}\n\n[LIVE SEARCH TELEMETRY DATA]:\n${extractedFact}\n\nIntegrate this live telemetry data directly into your answer.` 
          },
          ...cleanHistory
        ]

        // Re-query with updated search telemetry using available active pipeline
        if (isLocalHardwareOnline) {
          const localSearchRes = await $fetch<any>(targetLocalEndpoint, {
            method: 'POST',
            body: { model: modelConfig.id || 'llama3', messages: patchedSearchContext, stream: false },
            timeout: 10000
          })
          if (localSearchRes?.message?.content) {
            finalResponseText = localSearchRes.message.content
            activeExecutionSource += ' + Autonomous Web Search'
          }
        } else if (apiKey) {
          const searchGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${apiKey}`, 
              'Content-Type': 'application/json' 
            },
            body: { 
              model: 'llama-3.1-8b-instant', 
              messages: patchedSearchContext 
            }
          })

          if (searchGroqRes?.choices?.[0]?.message?.content) {
            finalResponseText = searchGroqRes.choices[0].message.content
            activeExecutionSource += ' + Autonomous Web Search'
          }
        }
      } catch (searchErr) {
        console.warn('Network search layers dropped packet.', searchErr)
      }
    }

    // ─── 7. FINAL RESPONSE GUARANTEE ──────────────────────────────────────
    if (!finalResponseText) {
      finalResponseText = '⚠️ **System Operational Alert**: Unable to retrieve response matrix from local hard drive node or Groq cloud infrastructure. Please check network connections.'
      activeExecutionSource = 'System Safeguard Fallback'
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
        content: `🔧 **Pipeline Recovery Confirmation**: Fail-safe operational path locked down.\n\n* **Status**: Stabilized\n* **Log Trace**: ${err?.message || 'Validation standard reset complete'}`
      }
    }
  }
})