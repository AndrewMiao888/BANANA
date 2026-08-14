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

    // ─── 2. STAGE DATA CLEANING & ROLLING SLIDING WINDOW ──────────────────
    const cleanHistory = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).trim()
      }))

    const MAX_API_CONTEXT_TURNS = 10
    const recentHistory = cleanHistory.length > MAX_API_CONTEXT_TURNS
      ? cleanHistory.slice(-MAX_API_CONTEXT_TURNS)
      : cleanHistory

    // ─── 3. AUTONOMOUS URL CRAWLING & EXTRACTION (CRAWL4AI PIPELINE) ────────
    let crawledWebContent = ''
    let extractedSources: any[] = []

    const urlMatch = incomingUserPrompt.match(/https?:\/\/[^\s]+/)
    const hasCrawlCommand = incomingUserPrompt.toLowerCase().includes('/crawl') || urlMatch

    if (hasCrawlCommand && !summaryContext) {
      const targetUrl = urlMatch ? urlMatch[0] : null
      if (targetUrl) {
        try {
          const crawl4aiEndpoint = (config as any).crawl4aiUrl || process.env.CRAWL4AI_URL || 'http://127.0.0.1:11235/crawl'
          const crawlResponse = await $fetch<any>(crawl4aiEndpoint, {
            method: 'POST',
            body: { url: targetUrl, word_count_threshold: 10 },
            timeout: 10000
          })

          if (crawlResponse && (crawlResponse.markdown || crawlResponse.success || crawlResponse.text)) {
            const scrapedText = crawlResponse.markdown || crawlResponse.text || JSON.stringify(crawlResponse)
            crawledWebContent = `[CRAWL4AI EXTRACTED GROUND-TRUTH CONTENT FOR URL: ${targetUrl}]\n${scrapedText.slice(0, 10000)}\n\n`
            
            extractedSources.push({
              id: extractedSources.length + 1,
              title: crawlResponse.title || targetUrl,
              url: targetUrl,
              snippet: scrapedText.slice(0, 250) + '...'
            })
          }
        } catch (crawlErr: any) {
          console.warn('Crawl4AI extraction warning:', crawlErr?.message)
        }
      }
    }

    // ─── 4. SYSTEM PROMPT & BASELINE CONFIGURATION ────────────────────────
    const isSummaryRequest = incomingUserPrompt.includes("GENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE")
    const mergedKnowledgePacket = [crawledWebContent, summaryContext].filter(Boolean).join('\n\n')

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
`.trim()

    // ─── 5. DUAL-STRATEGY CONTEXT GENERATION (LOCAL vs GROQ) ──────────────
    
    // Local Ollama: Full multi-turn context history
    const localSystemPrompt = isSummaryRequest 
      ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
      : `${cleanBaseSystemPrompt}\n\n[CONVERSATION KNOWLEDGE & GROUND-TRUTH CONTEXT]:\n${mergedKnowledgePacket || 'No prior context.'}`

    const localContextMessages = [
      { role: 'system', content: localSystemPrompt.trim() },
      ...recentHistory
    ]

    // Groq Cloud: Token-saving summary context + latest prompt
    const groqSystemPrompt = isSummaryRequest 
      ? "You are a title generator. Respond with EXACTLY a 2 to 4 word summary of the user topic. No punctuation, no quotes, no markdown, no filler."
      : `${cleanBaseSystemPrompt}\n\n[CONVERSATION SUMMARY MEMORY CONTEXT]:\n${summaryContext || 'No prior summary context available.'}\n\n[CRAWLED DATA]:\n${crawledWebContent || 'None'}`

    const groqContextMessages = [
      { role: 'system', content: groqSystemPrompt.trim() },
      { role: 'user', content: incomingUserPrompt }
    ]

    let finalResponseText = ''
    let activeExecutionSource = ''

    // ─── 6. HARD DRIVE LOCAL HARDWARE PROBING (PRIMARY RUNNER) ─────────────
    const localBaseUrl = (config as any).homeOllamaUrl || process.env.HOME_OLLAMA_URL || 'http://localhost:11434'
    let isLocalAvailable = false

    try {
      const localCheck = await fetch(`${localBaseUrl.replace(/\/$/, '')}/api/tags`, { 
        method: 'GET',
        signal: AbortSignal.timeout(800) // Fast 800ms hardware check
      })
      isLocalAvailable = localCheck.ok
    } catch (e) {
      isLocalAvailable = false
    }

    if (isLocalAvailable) {
      try {
        const localModelId = selectedModelId || 'qwen2.5:7b'
        const localResponse = await $fetch<any>(`${localBaseUrl.replace(/\/$/, '')}/api/chat`, {
          method: 'POST',
          body: { 
            model: localModelId, 
            messages: localContextMessages, 
            stream: false 
          },
          timeout: 12000 
        })
        
        finalResponseText = localResponse?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = 'Hard Drive Local Execution (Full History)'
          if (extractedSources.length > 0) activeExecutionSource += ' + Crawl4AI'
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

      // Tier 1: Groq Llama 3.1 8B Instant
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
          timeout: 12000
        })

        finalResponseText = groqInstantRes?.choices?.[0]?.message?.content || ''
        if (finalResponseText) {
          activeExecutionSource = 'Groq Cloud (Instant 8B via Summary Memory)'
          if (extractedSources.length > 0) activeExecutionSource += ' + Crawl4AI'
        }
      } catch (groqInstantErr: any) {
        // Tier 2: Fallback to Groq Llama 3.3 70B Versatile
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
            activeExecutionSource = 'Groq Cloud (Versatile 70B via Summary Memory)'
            if (extractedSources.length > 0) activeExecutionSource += ' + Crawl4AI'
          }
        } catch (groqVersatileErr: any) {
          console.error('Groq cloud fallback failed:', groqVersatileErr?.message)
        }
      }
    }

    // ─── 8. FINAL RESPONSE GUARANTEE ──────────────────────────────────────
    if (!finalResponseText) {
      finalResponseText = '⚠️ **System Operational Alert**: Unable to retrieve response matrix from local hard drive node or Groq cloud infrastructure. Please check network connections.'
      activeExecutionSource = 'System Safeguard Fallback'
    }

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