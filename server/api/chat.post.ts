import { defineEventHandler, readBody } from 'h3'

// Live Web Search tool helper
async function performWebSearch(query: string, apiKey: string): Promise<string> {
  if (!apiKey) return "Search failed: Tavily API key is not configured."
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: 3
      })
    })
    const data = await res.json()
    return data.results?.map((r: any) => `[Source: ${r.title}] ${r.content}`).join('\n\n') || "No results found."
  } catch (e: any) {
    return `Search query error: ${e.message}`
  }
}

// Memory Synthesizer
async function buildIncrementalSummary(oldSummary: string, newTurn: any, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Update the summary by merging the new turn. Return one dense paragraph.' },
          { role: 'user', content: `Summary: "${oldSummary}". New turn: ${JSON.stringify(newTurn)}` }
        ],
        max_tokens: 150
      })
    })
    const data = await res.json()
    return data?.choices?.[0]?.message?.content || oldSummary
  } catch {
    return oldSummary
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { messages, model, existingSummary } = body

  if (!messages || !Array.isArray(messages)) {
    throw new Error("Invalid conversation structure payload.")
  }

  const cleanMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant')
  const lastTurn = cleanMessages.slice(-2)
  const userPrompt = cleanMessages[cleanMessages.length - 1]

  const updatedSummary = config.groqApiKey 
    ? await buildIncrementalSummary(existingSummary || '', lastTurn, config.groqApiKey)
    : (existingSummary || 'Memory matrix synced.')

  let localFailed = false

  // 1. LOCAL OLLAMA FIRST (With local fallback check)
  if (model === 'Pro-Nana') {
    try {
      const ollamaRes = await fetch(`${config.homeOllamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: [
            { 
              role: 'system', 
              content: `${config.bananaSystemPrompt}\nAlways output your thought process in <thinking>...</thinking> tags first, then provide your final answer.` 
            }, 
            userPrompt
          ],
          stream: false
        }),
        signal: AbortSignal.timeout(4000) // 4-second fast check to see if local computer is awake
      })

      if (ollamaRes.ok) {
        const oData = await ollamaRes.json()
        return { 
          content: oData?.message?.content || '<thinking>Running local pipeline</thinking>Empty local engine response.', 
          provider: 'ollama', 
          updatedSummary 
        }
      } else {
        localFailed = true
      }
    } catch {
      localFailed = true
    }
  }

  // 2. AUTO-FALLBACK / CLOUD ROUTE WITH AUTOMATIC SEARCH DISCOVERY
  if (model === 'Instant-Nana' || model === 'Logic-Nana' || localFailed) {
    if (!config.groqApiKey) {
      return {
        content: `<thinking>System failed to reach local machine.</thinking>🚨 HIGH DEMAND WARNING: Cloud networks are currently over-capacity. Please switch on your local computer server and launch Ollama to run queries locally.`,
        provider: 'error',
        updatedSummary
      }
    }

    try {
      // Step A: Request first generation with explicit reasoning instructions
      const systemInstructions = `${config.bananaSystemPrompt}
[CONTEXT MEMORY MATRIX]: ${updatedSummary}

You must think out loud before writing any final answer. 
1. Always start your response with a thinking block: <thinking>your step-by-step thoughts</thinking>.
2. If you do not know the answer or lack up-to-date facts, output inside your thinking tags: "DECISION: SEARCH [your query]".
3. Keep final answers concise.`

      const cloudRes = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model === 'Logic-Nana' ? 'deepseek-r1-distill-llama-70b' : 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemInstructions },
            userPrompt
          ],
          temperature: 0.6
        })
      })

      if (!cloudRes.ok) throw new Error("Cloud network congestion.")

      const cData = await cloudRes.json()
      const firstResponse = cData?.choices?.[0]?.message?.content || ''

      // Step B: Check if the AI decided it needs to perform a web search
      const searchMatch = firstResponse.match(/<thinking>[\s\S]*?DECISION:\s*SEARCH\s*\[(.*?)\][\s\S]*?<\/thinking>/i)

      if (searchMatch && searchMatch[1] && config.tavilyApiKey) {
        const searchQuery = searchMatch[1].trim()
        
        // Execute automated background web search
        const searchResults = await performWebSearch(searchQuery, config.tavilyApiKey)

        // Step C: Supply search findings back to the model for a definitive answer
        const followUpRes = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: systemInstructions },
              userPrompt,
              { role: 'assistant', content: firstResponse },
              { role: 'user', content: `WEB SEARCH RESULTS:\n${searchResults}\n\nIncorporate these facts and output your final updated response (include a new <thinking> block acknowledging the search results).` }
            ],
            temperature: 0.4
          })
        })

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json()
          let finalContent = followUpData?.choices?.[0]?.message?.content || firstResponse
          if (localFailed) {
            finalContent = `⚠️ *Note: Local computer offline. Routing via Cloud Backup.*\n\n${finalContent}`
          }
          return { content: finalContent, provider: 'groq', updatedSummary }
        }
      }

      // If no search was required, return original response
      let finalContent = firstResponse
      if (localFailed) {
        finalContent = `⚠️ *Note: Local computer offline. Routing via Cloud Backup.*\n\n${finalContent}`
      }
      return { content: finalContent, provider: 'groq', updatedSummary }

    } catch (err) {
      // 3. BOTH CHANNELS FAILED -> RETURN CUSTOM HIGH DEMAND ERROR STATE
      return {
        content: `<thinking>Critical network pipeline timeout. Local machine status check: OFFLINE.</thinking>⚠️ HIGH DEMAND [COMPUTER NOT ON]:
Our cloud processing pipelines are congested with active workloads. 

To bypass these queues:
1. Boot up your local hardware node.
2. Ensure Ollama is running on port 11434.
3. Switch your model configuration to **Pro-Nana (Local)**.`,
        provider: 'error',
        updatedSummary
      }
    }
  }

  return { content: "System router failed to resolve target configuration.", provider: "error" }
})