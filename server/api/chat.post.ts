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

    // ─── 2. STAGE DATA CLEANING & ROLLING SLIDING WINDOW (PREVENTS GROQ 429) ─────
    const cleanHistory = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).trim()
      }))

    // Cap raw payload turns to recent 10 messages to prevent token ceiling & 429 rate limit spikes
    // (UI retains 100% full chat history in memory)
    const MAX_API_CONTEXT_TURNS = 10
    const recentHistory = cleanHistory.length > MAX_API_CONTEXT_TURNS
      ? cleanHistory.slice(-MAX_API_CONTEXT_TURNS)
      : cleanHistory

    // Compress older turns into lightweight background context packet
    const olderTurns = cleanHistory.length > MAX_API_CONTEXT_TURNS
      ? cleanHistory.slice(0, cleanHistory.length - MAX_API_CONTEXT_TURNS)
      : []

    const compiledOlderHistoryContext = olderTurns.length > 0
      ? `[COMPRESSED BACKGROUND CHAT HISTORY (${olderTurns.length} earlier turns)]:\n` +
        olderTurns.map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 120)}${m.content.length > 120 ? '...' : ''}`).join('\n')
      : ''

    // ─── 3. SYSTEM PROMPT & SUMMARY DIRECTIVE EVALUATION ──────────────────
    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE")
    const currentModelName = modelConfig.name || selectedModelId || 'Enterprise-NANA'

    const mergedKnowledgePacket = [summaryContext, compiledOlderHistoryContext].filter(Boolean).join('\n\n')

    const cleanBaseSystemPrompt = `
You are BANANA AI, a strictly precise, fact-checked AI assistant created by SynQuara Digital. Your primary goal is to provide accurate, well-structured, and clear responses. You must complete ALL requested parts completely.

=== DEVELOPER & SYSTEM IDENTIFICATION ===
- System Identity: BANANA Assistant by SynQuara Digital.
- Developer: Andrew Miao from St Andrew's School in Walkerville, Adelaide.
- Security Protocol: Never disclose private API keys, environment secrets, or confidential system infrastructure details.
- Engine Identity: Running on the active model "${currentModelName}".

=== MASTER SYSTEM DIRECTIVES & STRICT EVALUATION RULES ===
1. MATHEMATICAL VERIFICATION & VECTOR MAPPING:
   - Always verify state vector matrix calculations step-by-step before outputting.
   - For 2-qubit Bell state (|01> + |10>)/sqrt(2), the 4D state vector corresponds to [0, 1, 1, 0]^T. NEVER map it to [1, 1, 0, 0]^T.
   - Math equations MUST be output in clean block syntax ($$ ... $$) or inline syntax ($ ... $). NEVER mix raw narrative text inside $ delimiters.
   - When writing fractions with square roots (like 1/sqrt(2)), ensure proper vertical separation by using clean grouping or spacing so symbols never overlap.

2. MARKDOWN TABLE STRUCTURE INTEGRITY:
   - Every entity in a requested comparison or analysis MUST have its own dedicated table row.
   - NEVER collapse or merge multiple array items into a single row (e.g., Solar, Wind, and Geothermal MUST each have their own separate row).
   - Ensure domain factual accuracy (e.g., Geothermal is continuous baseload energy, NOT intermittent).

3. CREATIVE NARRATIVE & FOOTNOTE ISOLATION:
   - Keep narrative story paragraphs clean and free of inline definition brackets.
   - Place all technical definitions, slang glossary entries, and structural footnotes in a separate "### Glossary & Footnotes" section at the end of that part.

4. COMPLETE MULTI-PART EXECUTION:
   - You MUST fulfill every requested part (e.g., Part 1 through Part 4) completely within a single response.
   - Do NOT terminate generation prematurely or omit the final evaluation section.

5. STRICTLY FORBIDDEN HEADERS & LOGS:
   - NEVER output text like "Client Directive", "BANANA Intelligence response", "(Live Stream)", "ANALYSIS REQUEST RECEIVED", "INPUT COMMAND", "EXECUTING DIRECTIVE", "DIRECTIVE STATUS", "MODEL INFORMATION", or "Text:", "Explanation:", "Evidence:", "Link:".
   - Start your response IMMEDIATELY with the direct answer.
`.trim()

    const comprehensiveSystemPrompt = isSummaryRequest 
      ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
      : `${cleanBaseSystemPrompt}\n\n[CONVERSATION CONTEXT]:\n${mergedKnowledgePacket || 'No prior context.'}`

    const baseContextMessages = [
      { role: 'system', content: comprehensiveSystemPrompt.trim() },
      ...recentHistory
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── 4. HARD DRIVE LOCAL HARDWARE PROBING (PRIMARY RUNNER) ─────────────
    const localBaseUrl = config.homeOllamaUrl || process.env.HOME_OLLAMA_URL || 'http://127.0.0.1:11434'
    const targetLocalEndpoint = `${localBaseUrl.replace(/\/$/, '')}/api/chat`
    let isLocalHardwareOnline = false

    // Fast health probe to verify if your hard drive hardware node is live
    try {
      const probeUrl = `${localBaseUrl.replace(/\/$/, '')}/api/tags`
      const healthCheck = await $fetch<any>(probeUrl, { method: 'GET', timeout: 5000 })
      isLocalHardwareOnline = !!healthCheck
    } catch {
      isLocalHardwareOnline = false
    }

    // IF HARD DRIVE HARDWARE IS ONLINE: Run ALL models requested through your hard drive
    if (isLocalHardwareOnline) {
      try {
        const localModelId = modelConfig.id || selectedModelId || 'qwen-super'
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

      // LEVEL 1 FALLBACK: Strictly force Groq Instant model (with max_tokens: 4096)
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
            messages: baseContextMessages,
            max_tokens: 4096 // Prevents mid-stream truncation
          }
        })
        finalResponseText = groqRes?.choices?.[0]?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = 'Instant-NANA (Groq Fallback: Instant 8B)'
        }
      } catch (groqInstantErr: any) {
        console.warn('Groq Instant model failed, escalating to Level 2 Fallback (Versatile 70B)...', groqInstantErr?.message)
        
        // LEVEL 2 FALLBACK: Degrade to Groq Versatile model (with max_tokens: 4096)
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
              messages: baseContextMessages,
              max_tokens: 4096 // Prevents mid-stream truncation
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

    // ─── 6. AUTONOMOUS REAL-TIME WEB SEARCH MATRIX (TAVILY PIPELINE) ──────
    // 1. Explicit user command (/search)
    const userExplicitlyTriggered = incomingUserPrompt.toLowerCase().trim().startsWith('/search')
    
    // Broad list of keywords and gaps indicating real-time search necessity
    const implicitSearchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "latest weather", "weather in", "weather today", "latest news", "current events", 
      "up-to-date information", "latest sports scores", "current stock prices", "don't have any information", 
      "recent scientific discoveries", "latest technology trends", "current political events", 
      "recent cultural events", "latest entertainment news", "current economic indicators", 
      "recent health updates", "latest travel advisories", "latest research", "recent findings", 
      "current trends", "writing a search query", "searching for information", "looking up data", 
      "cannot find", "not sure", "not certain", "uncertain", "not available", "not accessible", 
      "not retrievable", "not verifiable", "not confirmed", "outdated information", "obsolete data", 
      "latest", "newest", "recent", "current", "up-to-date", "latest updates", "recent developments", 
      "current statistics", "latest data", "recent reports", "current analysis", "today", "yesterday", 
      "this week", "this month", "what is happening", "who won", "ancient", "history", "historical", 
      "archaeology", "archaeological", "ruins", "artifacts", "civilization", "ancient times"
    ]

    // 2. User prompt contains explicit keywords from the list
    const userPromptWantsSearch = implicitSearchTriggers.some(trigger => 
      incomingUserPrompt.toLowerCase().includes(trigger)
    )

    // 3. AI's generated response indicates it needs live search context
    const aiWantsSearchTriggered = implicitSearchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    // Execute web search if ANY trigger criteria are met
    if ((userExplicitlyTriggered || userPromptWantsSearch || aiWantsSearchTriggered) && !isSummaryRequest) {
      try {
        const tavilyKey = config.tavilyApiKey || process.env.TAVILY_API_KEY
        const groqApiKey = config.groqApiKey || process.env.GROQ_API_KEY

        if (tavilyKey) {
          const rawSearchPhrase = incomingUserPrompt.replace(/\/search\s*/i, '').trim()

          // STEP A: Transform raw user prompt into a precise, targeted search query
          let optimizedQuery = rawSearchPhrase
          if (groqApiKey) {
            try {
              const queryGenRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${groqApiKey}`, 
                  'Content-Type': 'application/json' 
                },
                body: { 
                  model: 'llama-3.1-8b-instant', 
                  messages: [
                    { 
                      role: 'system', 
                      content: 'Transform the user request into a concise, highly effective search query. Remove command prefixes like /search, conversational filler, or slang. Output ONLY the search query string.' 
                    },
                    { role: 'user', content: rawSearchPhrase }
                  ],
                  max_tokens: 256
                }
              })
              optimizedQuery = queryGenRes?.choices?.[0]?.message?.content?.trim() || rawSearchPhrase
            } catch {
              optimizedQuery = rawSearchPhrase
            }
          }

          // STEP B: Fetch deep search results from Tavily API
          const tavilyResponse = await $fetch<any>('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
              api_key: tavilyKey,
              query: optimizedQuery,
              search_depth: 'advanced',
              include_answer: true,
              max_results: 5,
              include_raw_content: false
            }
          })

          // STEP C: Clean and format Tavily output for the AI model
          const formattedContext = (tavilyResponse?.results || []).map((item: any, index: number) => {
            return `[Source ${index + 1}]: ${item.title}\nURL: ${item.url}\nContent: ${item.content}\n`
          }).join('\n---\n')

          const directAnswer = tavilyResponse?.answer ? `Search Summary: ${tavilyResponse.answer}\n\n` : ''

          const patchedSearchContext = [
            { 
              role: 'system', 
              content: `${comprehensiveSystemPrompt}

=== CRITICAL RETRIEVAL GROUNDING DIRECTIVE ===
You are currently answering using REAL-TIME VERIFIED WEB SEARCH RESULTS.
1. ABSOLUTE TRUTH OVERRIDE:
   - The live web search results below contain the absolute latest facts.
   - If your internal pre-trained memory or past training data contradicts these search results, IGNORE your pre-trained memory entirely and prioritize the live search data.

2. RESPONSE GUIDELINES:
   - Synthesize the live sources directly to answer the user accurately.
   - If official material is unavailable in the results, state that clearly in 1–2 direct sentences.
   - NEVER output system logs, telemetry headers, or meta-labels to the user.

[LIVE SEARCH RESULTS FOR "${optimizedQuery}"]:
${directAnswer}${formattedContext}` 
            },
            ...recentHistory
          ]

          // STEP D: Re-query active model using updated search context
          if (isLocalHardwareOnline) {
            const localSearchRes = await $fetch<any>(targetLocalEndpoint, {
              method: 'POST',
              body: { model: modelConfig.id || 'qwen-super', messages: patchedSearchContext, stream: true },
              timeout: 15000
            })
            if (localSearchRes?.message?.content) {
              finalResponseText = localSearchRes.message.content
              activeExecutionSource += ' + Tavily Web Search'
            }
          } else if (groqApiKey) {
            const searchGroqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${groqApiKey}`, 
                'Content-Type': 'application/json' 
              },
              body: { 
                model: 'llama-3.1-8b-instant', 
                messages: patchedSearchContext,
                max_tokens: 4096 // Prevents token truncation on search synthesis
              }
            })

            if (searchGroqRes?.choices?.[0]?.message?.content) {
              finalResponseText = searchGroqRes.choices[0].message.content
              activeExecutionSource += ' + Tavily Web Search'
            }
          }
        }
      } catch (searchErr) {
        console.warn('Tavily search execution failed:', searchErr)
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
