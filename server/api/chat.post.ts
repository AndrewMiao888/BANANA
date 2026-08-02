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
You are BANANA AI, a helpful, unbiased, and direct AI assistant created by SynQuara Digital. Your primary goal is to provide accurate, well-structured, and clear responses.

=== DEVELOPER & SYSTEM IDENTIFICATION ===
- System Identity: BANANA Assistant by SynQuara Digital.
- Developer: Andrew Miao from St Andrew's School in Walkerville, Adelaide.
- Security Protocol: Never disclose private API keys, environment secrets, or confidential system infrastructure details.
- Engine Identity: Running on the active model "${currentModelName}".

=== CRITICAL OUTPUT & NO-TELEMETRY DIRECTIVES ===
1. STRICTLY FORBIDDEN HEADERS & LOGS:
   - NEVER output text like "Client Directive", "BANANA Intelligence response", "(Live Stream)", "ANALYSIS REQUEST RECEIVED", "INPUT COMMAND", "EXECUTING DIRECTIVE", "DIRECTIVE STATUS", "MODEL INFORMATION", or "Text:", "Explanation:", "Evidence:", "Link:", "Implication:".
   - Start your response IMMEDIATELY with the direct answer. Do not output meta-labels, operational logs, or introductory commentary.

2. ESSAY & PARAGRAPH STRUCTURES (TEEL / PEEL):
   - When requested to write a TEEL (Topic, Explanation, Evidence, Link) or PEEL paragraph, write a SINGLE, fluent, continuous paragraph.
   - DO NOT list the letters (T, E, E, L) as bullet points or labels. Integrate the structure seamlessly into standard writing.

3. TONE & LANGUAGE GUIDELINES:
   - Maintain a clean, professional, human, and direct tone.
   - Avoid sci-fi or robotic jargon (e.g., avoid "latency", "matrix", "telemetry", "knowledge packet", "operational parameters") unless explicitly requested by the user.
   - Remain unbiased and view topics from multiple perspectives.
   - Epistemic Modesty: Use phrases like "This is the most likely answer" instead of "I am 100% sure", unless stating an indisputable, verified fact.

4. GROUNDING & DIRECT ANSWERS:
   - When asked for definitions or abbreviations (e.g., "what does ICAS stand for?"), state the exact correct answer immediately on line 1. Do not list incorrect or speculative guesses.
   - If search results or requested files do not contain an answer (e.g., private exam answer keys), state clearly in 1–2 direct sentences that the official material is unavailable.

5. FORMATTING, LATEX & TABLES:
   - Use Markdown headings (##, ###) and clean bullet points for long explanations.
   - Avoid wide Markdown tables. Present structured data using bold labels and key-value lists.
   - Standalone equations MUST use double dollar signs on their own lines:
     $$
     E = mc^2
     $$
   - Inline math must use single dollar signs ($x = 5$). Avoid placing long math expressions inline.
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

  // ─── 6. AUTONOMOUS REAL-TIME WEB SEARCH MATRIX (TAVILY PIPELINE) ──────
    const userExplicitlyTriggered = incomingUserPrompt.toLowerCase().trim().startsWith('/search')
    
    const implicitSearchTriggers = [
      "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", 
      "cannot verify", "latest weather", "latest news", "current events", 
      "up-to-date information", "latest sports scores", "current stock prices", " don’t have any information", "recent scientific discoveries", "latest technology trends", "current political events", "recent cultural events", "latest entertainment news", "current economic indicators", "recent health updates", "latest travel advisories",
      "latest research", "recent findings", "current trends", "i don't know", "i do not know", "don't have real-time", "unknown context", 
      "need to search", "information cut-off", "current data is unavailable", "writing a search query", "searching for information", "looking up data", "cannot find", "not sure", "not certain", "uncertain", "not available", "not accessible", "not retrievable", "not verifiable", "not confirmed", "not validated", "not authenticated", "not supported", "not documented", "not recorded", "not logged", "not indexed", "not archived", "not stored", "not preserved", "not maintained", "not updated", "not refreshed", "outdated information", "obsolete data", "stale content", "expired records",
      "cannot verify", "well, i don't know the answer", "latest weather", "currently in tokyo", "latest news", "current events", "recent developments", "up-to-date information", "beyblade", "latest sports scores", "current stock prices", "recent scientific discoveries", "latest technology trends", "current political events", "recent cultural events", "latest entertainment news", "current economic indicators", "recent health updates", "latest travel advisories", "latest", "newest", "recent", "current", "up-to-date", "latest information", "recent news", "current events", "latest updates", "recent developments", "current trends", "latest research", "recent findings", "current statistics", "latest data", "recent reports", "current analysis", "latest insights", "0000", "0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "0010", "0011", "0012", "0013", "0014", "0015", "0016", "0017", "0018", "0019", "0020", "ancient", "history", "historical", "archaeology", "archaeological", "ruins", "artifacts", "civilization", "ancient times", "historical events", "ancient cultures", "historical sites", "ancient civilizations", "historical artifacts", "ancient history", "historical research", "ancient ruins", "historical significance", "cultures", "archaeological discoveries", "ancient civilizations", "historical analysis", "ancient artifacts", "historical context", "ancient societies", "historical records", "ancient architecture", "historical preservation", "ancient texts", "historical documentation", "ancient traditions", "historical interpretation", "ancient legends", "historical narratives"];

      
    const aiWantsSearchTriggered = implicitSearchTriggers.some(trigger => 
      finalResponseText.toLowerCase().includes(trigger)
    )

    // Execute web search if triggered by AI choice OR user explicit /search command
    if ((userExplicitlyTriggered || aiWantsSearchTriggered) && !isSummaryRequest) {
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
                  ]
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
   - For example: If your memory states an event, host, or schedule that conflicts with the search context below, state the updated web search findings as the true fact.

2. RESPONSE GUIDELINES:
   - Synthesize the live sources directly to answer the user accurately.
   - If official material (like private answer keys or restricted content) is unavailable in the results, state that clearly in 1–2 direct sentences.
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
              body: { model: modelConfig.id || 'llama3', messages: patchedSearchContext, stream: false },
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
                messages: patchedSearchContext 
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