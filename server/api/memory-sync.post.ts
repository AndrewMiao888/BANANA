// server/api/memory-sync.post.ts
import { systemPrompts } from '~~/src/agents'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages, isLocalComputerOn, currentSummary } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { success: true, summary: currentSummary || 'No data generated yet.', extractedMemories: [] }
    }

    const latestUserMessage = messages[messages.length - 2]?.content || ''
    const latestAssistantMessage = messages[messages.length - 1]?.content || ''

    // ─── CASE 1: COMPUTER IS OFFLINE (INCREMENTAL CLOUD UPDATES) ───
    if (!isLocalComputerOn) {
      const config = useRuntimeConfig()
      const apiKey = config.groqApiKey

      if (!apiKey) {
        return { 
          success: true, 
          summary: currentSummary + ' (Cloud update skipped: missing auth key)', 
          extractedMemories: [] 
        }
      }

      // Fast incremental updates: only look at the single newest exchange to update memory
      const incrementalPrompt = [
        { 
          role: 'system', 
          content: 'You are a lightweight context extraction utility. Read the latest exchange and output a single sentence update to append to the historical summary. Do not output anything else.' 
        },
        { 
          role: 'user', 
          content: `Historical Summary: ${currentSummary}\n\nNew Exchange:\nUser: ${latestUserMessage}\nAssistant: ${latestAssistantMessage}\n\nProvide the short text to append:` 
        }
      ]

      try {
        const groqRes = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: { model: 'llama3-8b-8192', messages: incrementalPrompt }
        })

        const appendStr = groqRes?.choices?.[0]?.message?.content || ''
        const updatedSummary = currentSummary === 'No summary computed yet.' 
          ? appendStr 
          : `${currentSummary} ${appendStr}`

        // Extract a singular standalone key fact for the memory block array
        const extractedFact = latestUserMessage.length > 5 && latestUserMessage.length < 100 
          ? [latestUserMessage.substring(0, 50)] 
          : []

        return {
          success: true,
          summary: updatedSummary.trim(),
          extractedMemories: extractedFact
        }
      } catch (e) {
        console.warn('Cloud memory update failed:', e)
        return { success: true, summary: currentSummary, extractedMemories: [] }
      }
    }

    // ─── CASE 2: COMPUTER IS ONLINE (FULL LOCAL RE-READ & MAIN IDEA SUMMARY) ───
    // Read the complete message history array to compute a unified main idea summary
    const standardPayload = [
      { 
        role: 'system', 
        content: 'You are a context processing agent. Read the entire conversation history below and output a concise, clear main idea summary of the user goals and preferences.' 
      },
      { 
        role: 'user', 
        content: JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))) 
      }
    ]

    try {
      const ollamaRes = await $fetch<any>('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        body: {
          model: 'llama3:8b', // Uses the Standard local layout matrix
          messages: standardPayload,
          stream: false
        },
        timeout: 5000
      })

      return {
        success: true,
        summary: ollamaRes?.message?.content || currentSummary,
        extractedMemories: [] // No separate caching blocks needed since full history is active
      }
    } catch (localErr) {
      console.warn('Fallback to current status: local re-read timed out.', localErr)
      return { success: true, summary: currentSummary, extractedMemories: [] }
    }

  } catch (globalError: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Memory sync failed: ${globalError.message}`
    })
  }
})