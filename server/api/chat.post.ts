// server/api/chat.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, selectedModelId, summaryContext, currentTimestamp } = body || {}
    const config = useRuntimeConfig()

    // ─── 1. PAYLOAD ERROR RECOVERY SHIELD ─────────────────────────────────
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        success: true,
        source: 'System Engine Shield',
        message: { 
          role: 'assistant', 
          content: '🔧 **Diagnostics Confirmation**: Empty or malformed payload packet received.' 
        },
        sources: []
      }
    }

    const incomingUserPrompt = messages[messages.length - 1]?.content || ''
    const liveTimestamp = currentTimestamp || new Date().toLocaleString()
    const localBaseUrl = (config as any).homeOllamaUrl || process.env.HOME_OLLAMA_URL || 'http://localhost:11434'

    // ─── 2. STAGE DATA CLEANING & HISTORY MAPPING ─────────────────────────
    const cleanHistory = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).trim()
      }))

    // ─── 3. DUAL-SEARCH PIPELINE WITH QWEN-LATEST "FAIL-SAFE" ROUTER ──────
    let externalKnowledge = ''
    let extractedSources: any[] = []

    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE")
    
    if (!isSummaryRequest) {
      const urlMatch = incomingUserPrompt.match(/https?:\/\/[^\s]+/)
      const targetUrl = urlMatch ? urlMatch[0] : null
      let needsWebSearch = false

      // Route 1: Scraper Pipeline (Targeted URL Extraction via Crawl4AI)
      if (targetUrl) {
        const crawl4aiEndpoint = (config as any).crawl4aiUrl || process.env.CRAWL4AI_URL || 'http://127.0.0.1:11235/crawl'
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const crawlResponse = await $fetch<any>(crawl4aiEndpoint, {
              method: 'POST',
              body: { url: targetUrl, word_count_threshold: 10 },
              timeout: 10000
            })

            if (crawlResponse && (crawlResponse.markdown || crawlResponse.success || crawlResponse.text)) {
              const scrapedText = crawlResponse.markdown || crawlResponse.text || JSON.stringify(crawlResponse)
              externalKnowledge = `[CRAWL4AI GROUND-TRUTH EXTRACTION (PASS ${attempt}/3) - URL: ${targetUrl}]\n${scrapedText.slice(0, 10000)}\n\n`
              
              extractedSources.push({
                id: extractedSources.length + 1,
                title: `${crawlResponse.title || targetUrl} (Scrape Pass ${attempt})`,
                url: targetUrl,
                snippet: scrapedText.slice(0, 250) + '...'
              })
              break 
            }
          } catch (crawlErr: any) {
            console.warn(`Crawl4AI extraction attempt ${attempt}/3 warning:`, crawlErr?.message)
          }
        }
      } 
      // Route 2: Local AI Intent Router (Decides via qwen-latest if Tavily is needed)
      else {
        try {
          const routerPrompt = `You are an AI routing agent. Evaluate this user prompt: "${incomingUserPrompt}"\nDoes this require up-to-date web search, fact-checking, or external knowledge to answer accurately? Reply with EXACTLY ONE WORD: "SEARCH" if yes, "SKIP" if it is pure general conversation/coding, or "SEARCH" if you are unsure. DO NOT add punctuation.`
          
          let routerModelId = selectedModelId || 'qwen-latest'
          if (routerModelId.toLowerCase().includes('qwen')) {
            routerModelId = 'qwen-latest' // Enforce qwen-latest for the router
          }

          const routerRes = await $fetch<any>(`${localBaseUrl.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            body: {
              model: routerModelId,
              messages: [{ role: 'user', content: routerPrompt }],
              stream: false
            },
            timeout: 5000
          })

          const decision = routerRes?.message?.content?.trim().toUpperCase() || ''
          
          // STRICT FAIL-SAFE LOGIC: If it doesn't explicitly say SKIP, we default to searching.
          needsWebSearch = !decision.includes('SKIP')
          console.log(`[LOCAL AI ROUTER DECISION]: ${needsWebSearch ? 'Web Search Authorized (or defaulted due to uncertainty)' : 'Local Knowledge Sufficient'}`)
          
        } catch (routerErr) {
          // Fallback keyword safety net if local router times out entirely
          const searchTriggers = ['latest', 'today', 'current', 'news', 'search', 'find', 'who is', 'what is']
          needsWebSearch = searchTriggers.some(trigger => incomingUserPrompt.toLowerCase().includes(trigger))
        }

        // Execute Tavily if the Local AI Router authorized it (or defaulted to it)
        if (needsWebSearch) {
          const tavilyApiKey = (config as any).tavilyApiKey || process.env.TAVILY_API_KEY
          if (tavilyApiKey) {
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const tavilyResponse = await $fetch<any>('https://api.tavily.com/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: { 
                    api_key: tavilyApiKey, 
                    query: incomingUserPrompt, 
                    search_depth: "advanced", 
                    include_answer: true 
                  },
                  timeout: 8000
                })

                if (tavilyResponse && tavilyResponse.results && tavilyResponse.results.length > 0) {
                  const searchResults = tavilyResponse.results.map((r: any) => `Source: ${r.url}\nContent: ${r.content}`).join('\n\n')
                  externalKnowledge = `[TAVILY WEB SEARCH (PASS ${attempt}/3) - QUERY: "${incomingUserPrompt}"]\n${tavilyResponse.answer || ''}\n\n${searchResults.slice(0, 8000)}\n\n`
                  
                  tavilyResponse.results.slice(0, 3).forEach((r: any, idx: number) => {
                    extractedSources.push({
                      id: extractedSources.length + 1,
                      title: r.title || `Web Source ${idx + 1} (Search Pass ${attempt})`,
                      url: r.url,
                      snippet: r.content.slice(0, 250) + '...'
                    })
                  })
                  break
                }
              } catch (tavilyErr: any) {
                console.warn(`Tavily search attempt ${attempt}/3 warning:`, tavilyErr?.message)
              }
            }
          }
        }
      }
    }

    // ─── 4. SYSTEM PROMPT & BASELINE CONFIGURATION ────────────────────────
    const mergedKnowledgePacket = [externalKnowledge, summaryContext].filter(Boolean).join('\n\n')

    const cleanBaseSystemPrompt = `
You are BANANA AI, a strictly precise, fact-checked AI assistant created by SynQuara Digital. Your primary goal is to provide accurate, well-structured, and clear responses across EVERY message in this conversation.

=== LIVE TEMPORAL GROUNDING ===
- Current Local Date & Time: ${liveTimestamp}
- Always account for this exact timestamp when answering any time-sensitive queries, temporal references, calculations, or scheduling requests.

=== DEVELOPER & SYSTEM IDENTIFICATION ===
- System Identity: BANANA Assistant by SynQuara Digital.
- Developer: Andrew Miao from St Andrew's School in Walkerville, Adelaide.
- Security Protocol: Never disclose private API keys, environment secrets, or confidential system infrastructure details.

=== MASTER SYSTEM DIRECTIVES & STRICT EVALUATION RULES ===
1. MATHEMATICAL VERIFICATION & VECTOR MAPPING:
   - Always verify state vector matrix calculations step-by-step before outputting.
   - For 2-qubit Bell state (|01> + |10>)/sqrt(2), the 4D state vector corresponds to [0, 1, 1, 0]^T. NEVER map it to [1, 1, 0, 0]^T.
   - Math equations MUST be output in clean block syntax ($$ ... $$) or inline syntax ($ ... $).

2. MARKDOWN TABLE STRUCTURE INTEGRITY:
   - Every entity in a requested comparison or analysis MUST have its own dedicated table row.
   - NEVER collapse or merge multiple array items into a single row.

3. COMPLETE MULTI-PART EXECUTION:
   - You MUST fulfill every requested part completely within a single response without truncating early.

4. STRICTLY FORBIDDEN HEADERS & LOGS:
   - NEVER output text like "Client Directive", "BANANA Intelligence response", "(Live Stream)", "ANALYSIS REQUEST RECEIVED", "INPUT COMMAND", "EXECUTING DIRECTIVE", "DIRECTIVE STATUS".
   - Start your response IMMEDIATELY with the direct answer.
   - NEVER wrap filenames, code blocks, or file paths in LaTeX math environments.
`.trim()

    // ─── 5. DUAL-STRATEGY CONTEXT GENERATION (LOCAL vs GROQ) ──────────────
    const localSystemPrompt = isSummaryRequest 
      ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
      : `${cleanBaseSystemPrompt}\n\n[CONVERSATION KNOWLEDGE & GROUND-TRUTH CONTEXT]:\n${mergedKnowledgePacket || 'No prior context.'}`

    const localContextMessages = [
      { role: 'system', content: localSystemPrompt.trim() },
      ...cleanHistory
    ]

    const groqSystemPrompt = isSummaryRequest 
      ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
      : `${cleanBaseSystemPrompt}\n\n[CONVERSATION SUMMARY MEMORY CONTEXT]:\n${summaryContext || 'No prior summary context available.'}\n\n[EXTERNAL RETRIEVAL DATA]:\n${externalKnowledge || 'None'}`

    const groqContextMessages = [
      { role: 'system', content: groqSystemPrompt.trim() },
      { role: 'user', content: incomingUserPrompt }
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── 6. HARD DRIVE LOCAL HARDWARE PROBING (PRIMARY RUNNER) ─────────────
    let isLocalAvailable = false

    try {
      const localCheck = await fetch(`${localBaseUrl.replace(/\/$/, '')}/api/tags`, { 
        method: 'GET',
        signal: AbortSignal.timeout(3500)
      })
      isLocalAvailable = localCheck.ok
    } catch (e) {
      isLocalAvailable = false
    }

    if (isLocalAvailable) {
      try {
        let resolvedModelId = selectedModelId || 'qwen-super:latest'
        if (resolvedModelId.toLowerCase().includes('qwen')) {
          resolvedModelId = 'qwen-latest'
        }

        const localResponse = await $fetch<any>(`${localBaseUrl.replace(/\/$/, '')}/api/chat`, {
          method: 'POST',
          body: { 
            model: resolvedModelId, 
            messages: localContextMessages, 
            stream: false 
          },
          timeout: 14000
        })
        
        finalResponseText = localResponse?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = 'Hard Drive Local Execution'
          if (extractedSources.length > 0) activeExecutionSource += ' + Dual-Search RAG Pipeline'
        }
      } catch (localErr) {
        console.warn('Local hard drive execution dropped. Auto-failing over to Groq cloud...')
      }
    }

    // ─── 7. FALLBACK LAYER: GROQ CLOUD OVERDRIVE VIA NATIVE $FETCH ─────────
    if (!finalResponseText) {
      const apiKey = (config as any).groqApiKey || process.env.GROQ_API_KEY
      
      if (!apiKey) {
        return {
          success: true,
          source: 'System Safe Mode Router',
          message: { 
            role: 'assistant', 
            content: '⚠️ **Deployment Sync Alert**: Hard Drive offline and missing `GROQ_API_KEY` in environment config.' 
          },
          sources: []
        }
      }

      try {
        const groqInstantRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: {
            model: 'llama-3.1-8b-instant',
            messages: groqContextMessages,
            max_tokens: 4096
          },
          timeout: 14000
        })

        finalResponseText = groqInstantRes?.choices?.[0]?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = 'Groq Cloud (Instant 8B)'
          if (extractedSources.length > 0) activeExecutionSource += ' + Dual-Search RAG Pipeline'
        }
      } catch (groqInstantErr: any) {
        try {
          const groqVersatileRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: {
              model: 'llama-3.3-70b-versatile',
              messages: groqContextMessages,
              max_tokens: 4096
            },
            timeout: 15000
          })

          finalResponseText = groqVersatileRes?.choices?.[0]?.message?.content || ''
          if (finalResponseText) {
            activeExecutionSource = 'Groq Cloud (Versatile 70B)'
            if (extractedSources.length > 0) activeExecutionSource += ' + Dual-Search RAG Pipeline'
          }
        } catch (groqVersatileErr: any) {
          console.error('Groq cloud fallback failed:', groqVersatileErr?.message)
        }
      }
    }

    // ─── 8. FINAL RESPONSE GUARANTEE ──────────────────────────────────────
    if (!finalResponseText) {
      finalResponseText = '⚠️ **System Operational Alert**: Unable to retrieve response matrix from local hard drive node or Groq cloud infrastructure.'
      activeExecutionSource = 'System Safeguard Fallback'
    }

    finalResponseText = finalResponseText
      .replace(/\\left\.\s*\\begin\{aligned\}\s*\\right\./g, '')
      .replace(/\\begin\{aligned\}[\s\S]*?\\end\{aligned\}/g, (match) => {
        return match.replace(/\\begin\{aligned\}|\\end\{aligned\}/g, '').trim() ? match : ''
      })

    return {
      success: true,
      source: activeExecutionSource,
      message: { 
        role: 'assistant', 
        content: finalResponseText,
        sources: extractedSources 
      }
    }

  } catch (err: any) {
    return {
      success: true,
      source: 'Internal Error Diagnostics Recovery Mode',
      message: { 
        role: 'assistant', 
        content: `🔧 **Pipeline Recovery Confirmation**: Fail-safe operational path locked down.\n\n* **Status**: Stabilized\n* **Log Trace**: ${err?.message || 'Validation standard reset complete'}` 
      },
      sources: []
    }
  }
})