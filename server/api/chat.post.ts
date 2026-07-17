import { defineEventHandler, readBody } from 'h3'

// Live Web Search tool helper
async function performWebSearch(query: string, apiKey: string): Promise<string> {
  if (!apiKey) return "Search failed: Tavily API key is not configured."
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, search_depth: 'basic', max_results: 3 })
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

  // Synthesize memory summary in background using cloud if key exists
  const updatedSummary = config.groqApiKey 
    ? await buildIncrementalSummary(existingSummary || '', lastTurn, config.groqApiKey)
    : (existingSummary || 'Memory matrix synced.')

  let isLocalEngineOffline = false

  // ==========================================
  // RULE 1: LOCAL SELECTION -> TRY LOCAL OLLAMA DIRECTLY
  // ==========================================
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
        signal: AbortSignal.timeout(3000) // Fast 3-second heartbeat check
      })

      if (ollamaRes.ok) {
        const oData = await ollamaRes.json()
        return { 
          content: oData?.message?.content || '<thinking>Running local pipeline</thinking>Empty local engine response.', 
          provider: 'ollama', 
          updatedSummary 
        }
      } else {
        isLocalEngineOffline = true
      }
    } catch {
      isLocalEngineOffline = true
    }
  }

  // ==========================================
  // RULE 2: ROUTING CLOUD OR TRIGGERING LOCAL FALLBACK
  // ==========================================
  // If the user picked a cloud model OR our local check failed, use Groq
  if (model === 'Instant-Nana' || model === 'Logic-Nana' || isLocalEngineOffline) {
    
    if (!config.groqApiKey) {
      return {
        content: `<thinking>System routing failed. Local computer status: OFFLINE. Cloud recovery: NO KEYS.</thinking>🚨 HIGH DEMAND WARNING: Cloud networks are currently over-capacity. Please switch on your local computer server and launch Ollama to run queries locally.`,
        provider: 'error',
        updatedSummary
      }
    }

    try {
      const systemInstructions = `${config.bananaSystemPrompt}
[CONTEXT MEMORY MATRIX]: ${updatedSummary}

You must think out loud before writing any final answer. 
1. Always start your response with a thinking block: <thinking>your step-by-step thoughts</thinking>.
2. If you do not know the answer or lack up-to-date facts, output inside your thinking tags: "DECISION: SEARCH [your query]".
3. Keep final answers concise.`

      // FALLBACK STRATEGY: 
      // If we are forced to fall back due to local being offline, or if the user explicitly wants Instant,
      // we use 'llama-3.1-8b-instant'. Only explicit requests for 'Logic-Nana' get 'deepseek-r1-distill-llama-70b'.
      const targetCloudModel = (model === 'Pro-Nana' || model === 'Instant-Nana' || isLocalEngineOffline)
        ? 'llama-3.1-8b-instant' 
        : 'deepseek-r1-distill-llama-70b'

      const cloudRes = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetCloudModel,
          messages: [{ role: 'system', content: systemInstructions }, userPrompt],
          temperature: 0.6
        })
      })

      if (!cloudRes.ok) throw new Error("Cloud API connection failure.")

      const cData = await cloudRes.json()
      const firstResponse = cData?.choices?.[0]?.message?.content || ''

      // Check if AI requested search
      const searchMatch = firstResponse.match(/<thinking>[\s\S]*?DECISION:\s*SEARCH\s*\[(.*?)\][\s\S]*?<\/thinking>/i)

      if (searchMatch && searchMatch[1] && config.tavilyApiKey) {
        const searchQuery = searchMatch[1].trim()
        const searchResults = await performWebSearch(searchQuery, config.tavilyApiKey)

        // Web search follow-up sequence (Using rapid cloud fallback)
        const followUpRes = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: systemInstructions },
              userPrompt,
              { role: 'assistant', content: firstResponse },
              { role: 'user', content: `WEB SEARCH RESULTS:\n${searchResults}\n\nIncorporate these facts and output your final updated response.` }
            ],
            temperature: 0.4
          })
        })

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json()
          let finalContent = followUpData?.choices?.[0]?.message?.content || firstResponse
          if (isLocalEngineOffline) {
            finalContent = `⚠️ *Note: Local computer offline. Routing via Cloud Backup (Instant-Nana).*\n\n${finalContent}`
          }
          return { content: finalContent, provider: 'groq', updatedSummary }
        }
      }

      let finalContent = firstResponse
      if (isLocalEngineOffline) {
        finalContent = `⚠️ *Note: Local computer offline. Routing via Cloud Backup (Instant-Nana).*\n\n${finalContent}`
      }
      return { content: finalContent, provider: 'groq', updatedSummary }

    } catch (err) {
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